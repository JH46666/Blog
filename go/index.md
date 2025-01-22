# go

又被称作 21 世纪的 C 语言，不但能够访问底层操作系统还提供了强大的网络编程和并发编程，分布式编程。

1. 快速
2. 已编译
3. 安全
4. 代码简洁
5. 跨平台
6. 垃圾回收
7. 内置包 // http 网络协议包，json 解析包，time 时间包
8. 工具
9. 并发 // 并发的最小单元是协程，是一个微线程却有别于线程。协程由 Go 语言自身创建，并且由 Go 语言自身的运行时 runtime 调度。

# go 目录

GOROOT go 的安装目录。 GOPATH 就是我们自己以后开发的代码所存储的目录，GOPATH 下有三个目录 。

src 存储 go 的源代码（需要我们自己手动创建）。
pkg 存储编译后生成的包文件 （自动生成）。
bin 存储生成的可执行文件（自动生成）。

![go](./0081Kckwgy1glm2m13sjej31ds0p84cv.webp)

package 创建包 Go 语言以包作为管理单位，每一个源文件都必须先声明它的所属包，所以每个 Go 的源文件都会以一个 package 声明一个包名称。 package main 就是声明了一个 main 包。

import 导入包 在包声明之后使用 import 导入到需要的地方，import fmt 导入了一个 Go 语言内置提供的 fmt 包 。 如果需要导入多个包，就在括号内加入多个包的名称，每一行代表一个包。

```go
import (
    "fmt"
    "time"
)
```

变量
go 语言是静态强类型语言， 所以变量是有明确类型的。

类型 变量内可以存储哪种类型的数据。

值 变量内存储的具体的值。

地址 在计算机中可以找到变量的位置，计算机为变量开辟的一块内存地址。

默认就是当前声明的类型的零值。我们在使用变量时需要给他进行赋值。

赋值

```go
var age int     //声明 未赋值默认为0
age = 18        //赋值
```

简短定义

```go
//简短定义方式  声明并赋值
 name :="王铁蛋"
 age := 10

```

多变量定义

```go
//var方式声明多变量
 var a,b,c int
 a=1
 b=2
 c=3
//也可以写在一行
var a1,a2,a3 int =10,20,30
//也可以省略类型 根据数据进行类型推导
 var a1,a2,a3 =10,20,"ago"
//如果是多种类型 也可以使用集合
var(
    a1 =""
    a2 =10
)

```

```go
//简短定义方式定义多变量
name,age:="王钢蛋",18
println(name,age)
//重复定义就报错
name,age:="zhangsan",19
//如果定义的左边有一个新的变量
name,age,sex:="lisi",20,"女"
//左边有一个新的，对于前两个就是修改操作，后一个是声明并赋值操作。
```

在 go 语言中能够将很轻松的交换变量

```go
var a int =100 //新郎的信物a
var b int =200 //新娘的信物b

b,a=a,b  //新郎新娘交换礼物

fmt.Println(a,b)

```

匿名变量使用下划线" _ " 表示。 "_" 也称为空白标识符，

```go
package main

import (
    "fmt"
)

func main() {
    a, _ := 100, 200
    //这里第二个值200赋给了匿名变量_ 也就忽略了不需要再次打印出来
    fmt.Println(a)
}

```

```go
package main

import (
    "fmt"
    "os"
)

//全局变量
var name = "zhangsan"

//主函数 程序的入口
func main() {
    fmt.Println(name) //可以访问到全局变量name

    myfunc()
}

//自定义函数
func myfunc() {
    fmt.Println(name) //这里也可以访问到全局变量name

    age := 30
    fmt.Println(age) //age为myfunc的局部变量 只能够在函数内部使用

    if t, err := os.Open("file.txt"); err != nil {
        fmt.Print(t) //t作为局部变量 只能在if内部使用
    }
    fmt.Println(t) //在if外部使用变量则会报错 undefined: t  未声明的变量t
}


```

![常量](./0081Kckwgy1glm73g4pwuj31du0nuq7d.webp)
