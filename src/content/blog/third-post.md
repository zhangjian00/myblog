---
title: 'NAT是如何工作的'
description: 'Lorem ipsum dolor sit amet'
pubDate: 'May 13 2022'
heroImage: '/myblog/blog-placeholder-2.jpg'
---

局域网：
局域网内所有的设备IP地址，通常以192.168开头

如果公司内部有一个员工在玩王者荣耀（内网IP地址），使用UDP协议发送信息，发向王者荣耀的服务器（外网IP地址）。
数据到王者荣耀服务器可以通过寻址和路由找到目的地，但是数据从王者荣耀服务器回来的时候，王者荣耀服务器如何知道192.168开头的地址如何寻址呢？

## 网络地址转换协议（NAT协议）
![image.png](https://raw.githubusercontent.com/zhangjian00/image/main/20240407133426.png)

面试题：
### 网络地址转换协议（NAT）是如何工作的？
网络地址解析协议（NAT）解决的是内外网通信的问题，NAT通常发生在内网和外网衔接的路由器中，由路由器中的NAT模块提供网络地址转换能力
NAT最核心的能力：能够将内网中某个IP映射到外网IP，再把数据发给外网的服务器
NAT是如何实现的：
1. NAT需要作为一个中间层替换IP地址，当内网去连接外网的时候，NAT+路由器会在协议中将源IP的内网IP替换成一个出口IP，进而跟外网服务进行通信，当外网服务器返回数据跟出口IP通信的时候，目的IP是出口IP进行通信，经过NAT+路由器的时候，会将目的IP的出口IP转换成对应的内网IP
2. NAT需要缓存内网IP地址 和出口IP+端口的对应关系

思考：IPV6需要NAT吗？
