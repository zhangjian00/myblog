---
title: 'MQTT' 
description: 'Lorem ipsum dolor sit amet' 
pubDate: 'Oct 7 2024'  
heroImage: '/myblog/blog-placeholder-4.jpg'
---

# 1. 安装
```Python
pip install paho-mqtt
```

# 2. MQTT客户端基础示例
## 2.1 发布消息示例（Publisher)

### 2.1.1 导入库
```
import paho.mqtt.client as mqtt
```

### 2.1.2 创建MQTT客户端
```python
client = mqtt.Client()  # 创建MQTT客户端对象
```
### 2.1.3 连接到MQTT Broker
- 连接方法：connect(host, port, keepalive)
	- host ：代理地址（如：broker.hivemq.com)
	- port ：端口号： 一般为1883
	- keepalive：保持连接的时间（单位：秒）
- 回调函数：on_connect
```Python
connect_callback(client, userdata, flags, rc)
# client :
	# 类型 mqtt.client
	# 含义：当前MQTT客户端实例，通过这个参数可以在回调中访问客户端的属性和方法。
# userdata:
	# 类型： 任意类型（通常是None)
	# 函数： 用户自定义的数据，可以在创建客户端时设置。在回调中，可以使用这个参数传递任何与客户端相关的额外数据
# flags:
	# 类型： 字典
	# 含义：连接的标准 ，大部分情况下不需要关心
# rc:
	# 类型：整数
	# 含义：连接的结果代码 ，用于连接的状态，讲解的返回值
	
	### 
	# `rc` 的值表示连接的成功与否：
	# - **0**: 连接成功
	# - **1**: 连接被拒绝 - 协议版本不正确
	# - **2**: 连接被拒绝 - 客户端标识符无效
	# - **3**: 连接被拒绝 - 服务器不可用
	# - **4**: 连接被拒绝 - 用户名或密码错误
	# - **5**: 连接被拒绝 - 未授权
	# - **6-255**: 当前未使用。
	### 
```


```Python

def on_connect(client,userdata,flags,rc):
	printf("Connected with result code {}".format(rc))
	

client.on_connect = on_connect   # 设置连接回调，当客户端成功连接后，执行该函数
client.connect('broker.hivemq.com',1883,60)
```

### 2.1.4 发布消息
- 发布方法：pulish(topic, payload,qos=0)
	- topic : 消息主题
	- payload： 消息内容
	- qos：服务质量（0，1，2）
```Python
client.publish("test/topic","Hello, MQTT!") # 发布消息到主题
```
### 2.1.5 订阅主题
- 订阅方法：subscribe(topic,qos=0)
```Python
def on_message(client,userdata,msg):
	print("Received message :{} on topic: {}".format(msg.payload.decode(),msg.topic))


client.on_message = on_message
client.subscribe("test/topic")
```

### 2.1.6 启动网络循环
- 启动方法：loop_start() 或者 loop_forever()
```Python
client.loop_start() # 开启网络循环，处理消息
```

### 2.1.7 断开连接

```Python
client.disconnect() # 断开与Broker的连接
```

## 2.2 完整示例

```Python
import paho.mqtt.client as mqtt

# 连接成功后执行的回调函数
def on_connect(client,userdata,flags,rc):
    print("Connected with result code {}".format(rc))
    client.subscribe("test/topic")

# 接受消息
def on_message(client,userdata,msg):
    print("Received message:{} on topic : {}".format(msg.payload.decode(),msg.topic))
# 创建MQTT的客户端对象
client = mqtt.Client()

# 设置接受消息的回调
client.on_message = on_message

# 连接到MQTT的服务器
client.on_connect = on_connect
client.connect("172.20.10.5",1883,60)

client.loop_start()   # 启动网络循环

client.publish("test/topic","Hello,MQTT!") # 发布消息

import time
time.sleep(10)  # 等待接受消息
client.loop_stop() # 停止网络循环
client.disconnect() # 断开连接

```

# 3. 使用MQTT获取图片数据
```Python
#coding:utf-8  
import base64  
import numpy as np  
import cv2  
  
# 获取到的base64编码字符串  
base64_image_str = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD0z+xNS/54x/8Af3/61H9ial/zxj/7+/8A1qtDxrozdLyE/wDA/wD61DeNdGU4N5CD/v8A/wBavM/svDef3m/16XdFT+xNS/54xf8Af3/61S6Zod9bX8k8qoFZCBh885H+FT/8Jno4GftcOPXf/wDWpB410Zul5Cf+B/8A1q0o4ChRmpx3RFTFupFxbWpo/Y5vQfnR9jm9B+dZx8a6KDg3kGfTf/8AWoPjTR1GTdwgf7//ANavS9szj5Kfc0fsc3oPzo+xzeg/Os4eNdGYZF3CR/v/AP1qT/hNtF3Y+2QZ9N//ANaj2zDkp9zS+xzeg/Oj7HN6D86zj400cDJu4QPXf/8AWoHjTRmGRdwn/gf/ANaj2zDlp9zR+xzei/nR9jm9B+dZ3/Ca6MG2/bIc+m//AOtQ3jTRlGWu4R9X/wDrUe2YclPuaP2Ob0H50VnDxpoxGRdw/wDff/1qKPbMOSn3PGMkqw5YD22/rSlvuYOPoN1J2bg49XPH5UmSyrtJOP7g21xnmjvuuegOP4m5/KmnmM5yfqNorQTQtXlCSx6VetG6hlZLV3DA9DkDFOHh3Wypzo2o4/27dz+mKdmVyvsZ2fmXH5KM/rR91m4APqTk/lWh/wAI/rZ2/wDEn1I/S1dR/Kl/4R7W1c/8Se/UY/htHJ/PFFmHJLsZvWMHk4/vfKKUk7hg/wDfIz+taA8O62UP/El1DPq9u5/TFL/wj+uHbjR9SP0tnUfyosHLLsZw4ZugP1yfypG5jGQT/vfLU13Z3VhceVd201tIy7hHJEysR0zz9DzVc5EfIxz1c5P5UhEmfnABJ46KM/rTR8oYfKp+u40hJJU4Zv8Ax0UqNhmUMB7IuT+dAD1yyj75/DFFMVTg/I3Xu9FFhAFwzEBc+pOT/KggtGN2WH+2do/lQG+YjKj2Vcn880h4Tnj03nNAH0B4e/5FnSun/HnD0/3BWlWb4e/5FnSv+vOHt/sCrV1cGFMJjefXsK3clGN2ezTTaSROSAMk4HqaUHIyKw5C0rEuxOe5b/PFc1ejULG+8+xaQEtkiPuPfjBFc08Uo9Duo4P2jtzWZ6DRWFpHiKO82wXuyK6ZsLtBCPnpjPQ9uevbrit2uiE4zV4nNVpTpS5Zo8k+KHPii3GW/wCPJeB0++9cONoQ4Cg5/h5Ndx8UAf8AhKLb5c/6EvVsD771w4JZWAJ69EXH61nLc8at/EYrKu5NwB95D/SnIMkqCxA7gYFRn5VHAB/FjTiuZM4JGOrtj9KkzEXYAR+66+tFIrEZwzYz/CnFFMLEgYlmGWYegGB+dNBGzAKqc/wcmn7TkkhvqTx+WaaMmM4bPsgxSEe/+Hv+Ra0rOc/Y4ev+4KguJjJcyZ6KxX8uKn8PceGtK7f6HD/6AKyLx3sdWmikDLFKxkidujZwTg+xJ4+lRjJONNPoe9h+g67nZF2pyccD3qKOdYVIzl2+8fU/4VWkkMkhO7OOmKQLzkda8mE5Snc7lJJWIJ7NJZmdVwD1966zRbs3enKWLM8R8tmP8RABz154I/HNYBU+WSK2/D1u1vpYZ85lcyYIxgcAfyz+Nerho2lczxNb2kEn0POPijtHim1J8v8A481+91++9cTnKNwxGerYArt/ih/yNNr8wH+hr/Dk/feuI2/e3Aj3Zif0raW585W/iMQEYXaR9Ix/WglVlOQoJHVjk0v3ox95gPqopcgSAdB6KCf1qTMaCRnmXr2wKKdtPPyf99PzRRcAON5OF3e5yaTkxneDg9NxAFP3HeRkdOir/Wm5+Q4G3nqxzQB7/wCHf+RZ0np/x5w9P9wVPf6dbalb+TcoSByrKcMp9Qag8Pf8izpX/XnD/wCgCtKt3FSVmexB2SOG1TTJ9Bk82IyT2TYy78sje5H8/fH1S3vbeRRlwPxruqqjTbETecLK283du3+Uu7d1znHWuT6moyvDQ39q7WZiWVo9/tKArb95MdfYev8ASukVVRQqgBQMAAcAUtFdUIKCMnK55J8UAx8UW2N2Psa9Mf33rh143YKZJ/hGTXcfFH/kabX5c/6GvU4/jeuIBY7sE49AMD86zlueTW/iMRh8q7v/AB/n9KeMluM47YAApmVVAFIyT/CN1KQTJlwDgcbzz+VSZjQE55j6/wB3NFKAWyQXx7JRQFj03/hWNuTzfS49MjH8qT/hWFttwLyRfpj/AOJrsPt0v91PyNH26X+6n5Guv2D7Hfaj2MmDw7qttbxQQ6/dJFEoRFG3gAYA+7TxoetZz/wkV4f++f8A4mtP7dL/AHU/I0fbpf7qfkafsWVz0zNOh60QB/wkd2Pps/8AiaP7E1r/AKGK7/8AHf8A4mtL7dL/AHU/I0fbpf7qfkaPYsfPTM0aHrQ6+Irs/XZ/8TQdE1o/8zFdj6BP/ia0vt0v91PyNH26X+6n5Gj2LDnpnNaj4Ek1a5W4vtTmnmVNgdtuQuScfd9Saqf8Kvtuc3sp+pH+Fdh9ul/up+Ro+3S/3U/I0vYMl+xe6OPPwwtmI/02UAdgQP6Uf8KvtecXkgJ7jH+Fdh9ul/up+Ro+3S/3U/I0ewfYX7nsch/wrG373sp+pH+FFdf9ul/up+Roo9h5B+57FaiiiuoyCiiigQUUUUAFFFFABRRRQAUUUUAFFFFAH//Z"  
  
# 将base64解码成二进制的数据  
image_data = base64.b64decode(base64_image_str)  
  
# 将二进制数据转换为numpy数组  
image_array = np.frombuffer(image_data,dtype=np.uint8)  

  
# 使用opencv将numpy数组解码为图像  
image = cv2.imdecode(image_array,cv2.IMREAD_COLOR)  
  
cv2.imshow("Decoded Image",image)  
cv2.waitKey(0)
```

![image.png](https://blogweb-01.oss-cn-beijing.aliyuncs.com/20241008165303.png)
