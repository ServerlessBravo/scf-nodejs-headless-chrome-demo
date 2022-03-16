'use strict'

const { ONE_SECOND, PAGE_NUM } = require('./constants');

async function sleep(seconds) {
  setTimeout(() => {
    Promise.resolve(true)
  }, seconds * ONE_SECOND)
}

const puppeteer = require('puppeteer');
let isRefreshing = false; // 避免健康检查跟定时刷新同时执行。
/**
 * 启动一个浏览器
 * @return {Object} 浏览器实例
 */
async function getNewBrowserInstance() {
  let browser = null;
  try {
    browser = await puppeteer.launch({
    // headless: false,
    defaultViewport: {
      // 默认视口宽高750x600，兼容老的模板
      width: 750,
      height: 600,
    },
    ignoreHTTPSErrors: true,
    ignoreDefaultArgs: ['--disable-dev-shm-usage'],
    args: [
      '--disable-gpu',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--no-zygote',
      '--autoplay-policy=user-gesture-required',
      // '--single-process', // 采用单进程浏览器架构，
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-dev-shm-usage',
      '--disable-domain-reliability',
      '--disable-extensions',
      '--disable-features=AudioServiceOutOfProcess',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-notifications',
      '--disable-offer-store-unmasked-wallet-cards',
      '--disable-popup-blocking',
      '--disable-print-preview',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-speech-api',
      '--disable-sync',
      '--hide-scrollbars',
      '--ignore-gpu-blacklist',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-first-run',
      '--no-pings',
      '--password-store=basic',
      '--use-gl=swiftshader',
      '--use-mock-keychain',
      '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/88.0.4298.0 Safari/537.36 PosterEgg',
    ],
    });
  } catch (error) {
    console.error('puppeteer初始化错误:', error.message);
  }

  // 浏览器启动时间
  browser.createTime = Date.now();
  // 默认page放入allPages
  browser.allPages = await browser.pages().then((pages) => {
    pages.forEach((p) => (p.isBusy = false));
    return pages;
  });
  // 初始化时新建PAGE_NUM个tab，在渲染时可以直接复用
  for (let i = 0; i < PAGE_NUM; i++) {
    const page = await browser.newPage();
    page.isBusy = false;
    browser.allPages.push(page);
  }
  return browser;
}
/**
 * 重新启动一个浏览器
 * @param {App} app
 */
async function refreshBrowser(app) {
  if (isRefreshing) {
    return;
  }
  isRefreshing = true;
  const oldBrowser = app.headlessBrowser;
  app.headlessBrowser = await getNewBrowserInstance();
  closeBrowser(oldBrowser);
}

function closeBrowser(oldBrowser, retry = 0) {
  if (oldBrowser.activePageNum <= 0) {
    // 没有在处理请求时，直接关闭老的浏览器
    oldBrowser.close();
    isRefreshing = false;
  } else if (retry < 6) {
    setTimeout(() => {
      // 每隔十秒询问一下浏览器任务处理完没有，
      closeBrowser(oldBrowser, retry + 1);
    }, 10000);
  } else {
    oldBrowser.close();
    isRefreshing = false;
  }
}

module.exports = {
  sleep,
  getNewBrowserInstance,
  refreshBrowser,
};
