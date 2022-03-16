"use strict";

const puppeteer = require("puppeteer");
const Controller = require("egg").Controller;
const fs = require("fs")


class HomeController extends Controller {
  async index() {
    const { ctx } = this;

    ctx.set("content-type", "text/html");
    await ctx.render("index.html", {
      msg: "hi, egg",
    });
  }

  async list_dir() {
    const { ctx } = this;
    const query = ctx.query;
    console.log("parameter folder:" + query.name);
    
    const filesArray = fs.readdirSync(query.name);
    ctx.body = [
      {
        files: filesArray,
      },
    ]; 
  }

  async test() {
    const { ctx } = this;

    const browser = await puppeteer.launch({
      executablePath: "/opt/chrome-linux/chrome",
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });
    const page = await browser.newPage();
    await page.goto("https://www.baidu.com");
    const pageTitle = await page.title();
    console.log("page title:" + pageTitle);
    await browser.close();
    ctx.body = [
      {
        page_title: pageTitle,
      },
    ];
  }

}

module.exports = HomeController;