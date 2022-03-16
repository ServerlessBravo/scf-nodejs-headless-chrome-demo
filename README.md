# 通过云函数运行 Headless Chromium


## 简介

SCF中可以执行 `Chromium` 进行网页访问等操作，有两种使用方法：

- 把 Chromium 作为Layer进行安装
- 把 Chromium 放到共享存储CFS从而避免代码包的限制

两种方式 `chrome` 可执行文件的位置不同，需要修改对应的代码配置：

app/controllers/home.js:

```js
const browser = await puppeteer.launch({
      // 使用Layer的方式部署 driver，可以直接通过 /opt目录引用
      // 注意⚠️：文件路径中不需要添加Layer名称
      executablePath: "/opt/chrome-linux/chrome",
      // 使用 CFS 的方式部署 driver，默认情况可以直接通过 /mnt 目录引用
      // executablePath: "/mnt/chrome-linux/chrome",
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });
    ...
}
```

## 部署函数

1. 创建Zip包

    ```bash
    zip -r headless_chrome_nodejs.zip . -x "*node_modules*" -x "*.git*"
    ```
2. 创建 Web 函数

    ```bash
    函数类型	    Web函数
    运行环境	    Nodejs 12.16
    内存	        512MB
    执行超时时间  10秒
    ```

3. 部署并自动在线安装依赖

    依赖较多，请耐心等待：
    
    ![](https://user-images.githubusercontent.com/251222/158589997-d57b130b-b5db-4c53-8a7c-2bf3139a1ed6.png)
    
    或者通过 Shell 的方式在终端按照

    ```bash
    export PUPPETEER_SKIP_DOWNLOAD='true'
    cd src
    npm install
    ```
## 下载 Chromium

### 1.找到对应的 `Chromium` 版本

⚠️ 注意下载的版本和 `puppeteer` 之间的 [映射关系](https://github.com/puppeteer/puppeteer/blob/main/versions.js):

```js
    ['100.0.4889.0', 'v13.5.0'],
    // 该版本为Demo的Pupeteer版本
    ['99.0.4844.16', 'v13.2.0'],
    ['98.0.4758.0', 'v13.1.0'],
    ['97.0.4692.0', 'v12.0.0'],
    ['93.0.4577.0', 'v10.2.0'],
    ['92.0.4512.0', 'v10.0.0'],
```

### 2.找到对应的 `Bulild` 

- 链接：https://vikyd.github.io/download-chromium-history-version/#/
- 搜索版本对应的 `Build`

  ![Build 链接](https://user-images.githubusercontent.com/251222/158581688-b5a390aa-e969-4181-a8cc-428c65bf839a.png)

- 获得下载链接，例如：[r961656](https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Linux_x64%2F961656%2Fchrome-linux.zip)

### 3.下载对应文件：

![](https://user-images.githubusercontent.com/251222/158582196-fb7c90bc-75b0-40f1-9d3a-cbf78611781f.png)


## 通过层安装

### 1. 创建层

通过控制台创建有50MB的限制，需要选择通过COS创建Layer的方式，提前把 Zip 文件放到 COS，然后按照下面的方式创建 Layer：

![](https://user-images.githubusercontent.com/251222/158583758-530e1d1d-41a1-4e38-82c4-3eb1f6c59aa3.png)

### 2. 绑定层

![](https://user-images.githubusercontent.com/251222/158590530-f592f3d2-a47a-421b-bc5d-230c963178a4.png)


## 通过CFS 安装

- ⚠️：如果总的文件大小超过500MB，需要把 Chromium 放到 CFS上，减少代码包的体积
- 创建CFS之后，可以通过虚拟机挂载 CFS，然后把下载的Zip包上传到对应的目录
- 然后配置函数，函数启动的时候自动挂载 CFS:

  ![](https://user-images.githubusercontent.com/251222/158591094-ef6d5595-ee95-4594-b99c-0e85ee98e1d8.png)

## 测试

获取APIGW地址，运行以下命令：

```bash
curl https://service-xxxxx-1253970226.gz.apigw.tencentcs.com/release/test

## 返回通过Headless Chrome抓取的标题
[{"page_title":"百度一下，你就知道"}]

```

## 更多用法
[puppeteer/puppeteer](https://github.com/puppeteer/puppeteer)
