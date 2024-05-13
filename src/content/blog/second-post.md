---
title: 'TCP保活机制Keep-Alive'
description: 'Lorem ipsum dolor sit amet'
pubDate: 'May 13 2024'
heroImage: '/myblog/blog-placeholder-4.jpg'
---

对于TCP来说，当连接处于“静默”状态的时候，没有办法发现TCP连接是有效的还是无效的，比如客户端突然崩溃，服务器端可能几天内都维护着一个无用的连接。
静默的一些情况：
	- 连接建立后未立即发送数据
	- 数据传输完毕后的空闲时间
	- 网络延迟和阻塞
	- 应用层空闲状态

解决方案：
## 1. TCP保活机制Keep-Alive
该机制的原理是，定义一个时间段，在这个时间段内，如果没有任何连接相关的活动，TCP保活机制会开始作用，每隔一段时间间隔，发送一个探测报文，该探测报文包含的数据非常少，如果连续几个探测报文，都没有响应，则认为当前的TCP连接已经死亡，系统内核将错误信息通知给上层应用程序。

上述的时间段分别为保活时间、保活时间间隔、保活探测次数。在 Linux 系统中，这些变量分别对应 sysctl 变量`net.ipv4.tcp_keepalive_time`、`net.ipv4.tcp_keepalive_intvl`、 `net.ipv4.tcp_keepalve_probes`，默认设置是 7200 秒（2 小时）、75 秒和 9 次探测。

**该保活机制默认是关闭的**

在 Linux 系统中，也可以通过修改相应的 sysctl 变量来全局开启 TCP 的保活机制。通过修改 `/etc/sysctl.conf` 文件，并添加相应的配置项，然后通过 `sysctl -p` 命令使配置生效。例如：
```yaml
net.ipv4.tcp_keepalive_time = 7200
net.ipv4.tcp_keepalive_intvl = 75
net.ipv4.tcp_keepalve_probes = 9
```
也可以使用setsockopt来设置：
```C
#include <stdio.h>
#include <stdlib.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/tcp.h>

int main() {
    int client_socket = socket(AF_INET, SOCK_STREAM, 0);
    if (client_socket < 0) {
        perror("Socket creation failed");
        exit(EXIT_FAILURE);
    }

    // 开启TCP的保活机制
    int optval = 1;
    if (setsockopt(client_socket, SOL_SOCKET, SO_KEEPALIVE, &optval, sizeof(optval)) < 0) {
        perror("Setting SO_KEEPALIVE option failed");
        exit(EXIT_FAILURE);
    }

    // 设置保活时间（单位：秒）
    int keepalive_time = 7200;
    if (setsockopt(client_socket, IPPROTO_TCP, TCP_KEEPIDLE, &keepalive_time, sizeof(keepalive_time)) < 0) {
        perror("Setting TCP_KEEPIDLE option failed");
        exit(EXIT_FAILURE);
    }

    // 设置保活时间间隔（单位：秒）
    int keepalive_interval = 75;
    if (setsockopt(client_socket, IPPROTO_TCP, TCP_KEEPINTVL, &keepalive_interval, sizeof(keepalive_interval)) < 0) {
        perror("Setting TCP_KEEPINTVL option failed");
        exit(EXIT_FAILURE);
    }

    // 设置保活探测次数
    int keepalive_probes = 9;
    if (setsockopt(client_socket, IPPROTO_TCP, TCP_KEEPCNT, &keepalive_probes, sizeof(keepalive_probes)) < 0) {
        perror("Setting TCP_KEEPCNT option failed");
        exit(EXIT_FAILURE);
    }

    // 连接服务器
    struct sockaddr_in server_addr;
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(server_port);
    server_addr.sin_addr.s_addr = inet_addr("server_ip");

    if (connect(client_socket, (struct sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
        perror("Connection to server failed");
        exit(EXIT_FAILURE);
    }

    // 发送和接收数据...

    return 0;
}
```

## 2. 应用层探活

如果使用TCP自身的Keep-Alive机制，在linux系统中，最少要经过2小时11分钟15秒才可以发现一个“死亡”连接。

所以需要在应用层找到更好的解决方案，在应用层模拟TCP Keep-Alive机制，来完成应用层的连接探活

设计一个PING-PONG的机制，需要保活的一方，比如客户端，在保活时间达到后，发起对连接的PING操作，如果服务器端对PING操作有回应，则重新设置保活时间，否则则对探测次数进行计数，如果最终探测次数预先设计的值之后，则认为连接已经无效。

这里需要关注两个点：
需要使用定时器，可以使用I/O复用自身的机制来实现（如select的最后一个参数），另一个是设计PING-PONG的协议

```C
typedef struct {
    u_int32_t type;
    char data[1024];
} messageObject;
 
#define MSG_PING          1
#define MSG_PONG          2
#define MSG_TYPE1        11
#define MSG_TYPE2        21
```

客户端代码：
```C
#include <stdio.h>
#include <sys/socket.h>
#include <sys/types.h> /* See NOTES */
 #include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/ip.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <stdlib.h>
#include <sys/select.h>
#include <string.h>
#include <unistd.h>

#define ERRLOG(msg)                                         \
    do {                                                    \
        printf("%s %s %d\n", __func__, __FILE__, __LINE__); \
        perror(msg);                                        \
        exit(-1);                                           \
    } while (0)

typedef struct {
    u_int32_t type;
    char data[1024];
} messageObject;
 
#define MSG_PING          1
#define MSG_PONG          2
#define MSG_TYPE1        11
#define MSG_TYPE2        21

#define    KEEP_ALIVE_TIME  10
#define    KEEP_ALIVE_INTERVAL  3
#define    KEEP_ALIVE_PROBETIMES  3

int main(int argc, char const* argv[])
{
    int sockfd;
    if ((sockfd = socket(AF_INET, SOCK_STREAM, 0)) == -1) {
        ERRLOG("socket error");
    }

    struct sockaddr_in serveraddr;
    memset(&serveraddr,0,sizeof(serveraddr));
    serveraddr.sin_family = AF_INET;
    serveraddr.sin_addr.s_addr = inet_addr(argv[1]);
    serveraddr.sin_port = htons(atoi(argv[2]));
    
    socklen_t serveraddr_len = sizeof(serveraddr);
    if(connect(sockfd,(struct sockaddr *)&serveraddr,serveraddr_len)==-1)
    {
        ERRLOG("connect error");
    }

    fd_set readfds;
    fd_set readfds_temp;

    struct timeval tv;
    tv.tv_sec = KEEP_ALIVE_TIME;
    tv.tv_usec = 0;

    messageObject msg;

    FD_ZERO(&readfds);
    FD_SET(sockfd,&readfds);

    int ret = 0;
    //记录探活次数
    int heartbeat = 0;
    char buff[4096] = {0};
    while(1)
    {
        readfds_temp = readfds;
        if((ret = (select(sockfd+1,&readfds_temp,NULL,NULL,&tv)))==-1)
        {
            ERRLOG("select error");
        }else if(ret == 0)
        {
            //超时
            //如果探活次数+1大于规定的探活次数
            //代表已发送规定的探活次数，那么连接已断开
            if(++heartbeat > KEEP_ALIVE_PROBETIMES)
            {
                ERRLOG("connection dead");
            }
            printf("send heartbeat %d\n",heartbeat);
            //发送PING包
            msg.type = htonl(MSG_PING);
            if(send(sockfd,&msg,sizeof(messageObject),0)==-1)
            {
                ERRLOG("send error");
            }
            tv.tv_sec = KEEP_ALIVE_INTERVAL;
            continue;
        }
        if(FD_ISSET(sockfd,&readfds_temp)){
            if((ret = (recv(sockfd,(char *)buff,4096,0)))==-1)
            {
                ERRLOG("recv error");
            }else if(ret == 0){
                break;
            }
            printf("接收到数据 使heartbeat置0\n");
            heartbeat = 0;
            tv.tv_sec = KEEP_ALIVE_TIME;
        }

    }
    close(sockfd);
    return 0;
}

```

服务器代码：
```C
#include <stdio.h>
#include <sys/socket.h>
#include <sys/types.h> /* See NOTES */
 #include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/ip.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <stdlib.h>
#include <sys/select.h>
#include <string.h>
#include <unistd.h>

#define ERRLOG(msg)                         \
    do { \
        printf("%s %s %d\n", __func__, __FILE__, __LINE__); \
        perror(msg); \
        exit(-1);\
    } while (0)

typedef struct {
    u_int32_t type;
    char data[1024];
} messageObject;
 
#define MSG_PING          1
#define MSG_PONG          2
#define MSG_TYPE1        11
#define MSG_TYPE2        21

#define    KEEP_ALIVE_TIME  10
#define    KEEP_ALIVE_INTERVAL  3
#define    KEEP_ALIVE_PROBETIMES  3

int main(int argc, char const* argv[])
{
    int sockfd;
    if ((sockfd = socket(AF_INET, SOCK_STREAM, 0)) == -1) {
        ERRLOG("socket error");
    }

    int sleepTime = atoi(argv[3]);
    struct sockaddr_in serveraddr;
    memset(&serveraddr,0,sizeof(serveraddr));
    serveraddr.sin_family = AF_INET;
    serveraddr.sin_addr.s_addr = inet_addr(argv[1]);
    serveraddr.sin_port = htons(atoi(argv[2]));
    
    socklen_t serveraddr_len = sizeof(serveraddr);
    
    if(bind(sockfd,(struct sockaddr *)&serveraddr,serveraddr_len)==-1)
    {
        ERRLOG("bind error");

    }
    if(listen(sockfd,5)==-1)
    {
        ERRLOG("listen error");
    }
    int acceptfd;
    struct sockaddr_in clientaddr;
    socklen_t clientaddr_len = sizeof(clientaddr);

    if((acceptfd=(accept(sockfd,(struct sockaddr *)&clientaddr,&clientaddr_len)))==-1)
    {
        ERRLOG("accept error");
    }
    messageObject msg;
    messageObject pong_msg;
    int nbytes = 0;
    while(1){
        if(-1==(nbytes=recv(acceptfd,&msg,sizeof(msg),0)))
        {
            ERRLOG("recv error");
        }else if(nbytes==0)
        {
            printf("client quit");
            close(acceptfd);
            break;
        }
        printf("recevied %d bytes\n",nbytes);
        
        switch (ntohl(msg.type))
        {
        case MSG_TYPE1:
            printf("process MSG_TYPE1\n");
            break;
        case MSG_TYPE2:
            printf("process MSG_TYPE2\n");
            break;
        case MSG_PING:
            //对端发来了探测包
    
            pong_msg.type = MSG_PONG;
            sleep(sleepTime);
            
            if(send(acceptfd,(char *)&pong_msg,sizeof(pong_msg),0)==-1)
            {
                ERRLOG("send error");
            }
            
            break;
        default:
            break;
        }
    }

    close(sockfd);
    return 0;
}

```
