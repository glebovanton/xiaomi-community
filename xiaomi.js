require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const isLocal = process.argv.includes('--log') || process.argv.includes('--local');

const logDir = path.resolve(__dirname, 'logs');
if (isLocal && !fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logFile = path.join(logDir, `${new Date().toISOString().slice(0, 10)}.log`);

function log(message) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${message}`;
    console.log(line);
    if (isLocal) {
        fs.appendFileSync(logFile, line + '\n');
    }
}

(async () => {
    if (!process.env.XIAOMI_USER || !process.env.XIAOMI_PASS) {
        throw new Error('❌ XIAOMI_USER или XIAOMI_PASS не заданы. Установи переменные окружения!');
    }

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox'],
        defaultViewport: {
            width: 390,
            height: 844,
            isMobile: true,
            hasTouch: true
        }
    });

    const page = await browser.newPage();

    await page.setUserAgent(
        'Mozilla/5.0 (Linux; Android 12; Redmi Note 12 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
    );

    // Переход на страницу входа и авторизация
    await page.goto('https://c.mi.com/global/forum-type/ALL', { waitUntil: 'networkidle2' });

    // Открытие бокового меню
    await page.waitForSelector('i.svg-icon-box.navM-menu', { timeout: 10000 });
    await page.click('i.svg-icon-box.navM-menu');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const loginBtn = await page.$('div.loginUser');
    if (loginBtn) {
        await loginBtn.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }

    if (page.url().includes('account.xiaomi.com')) {
        await page.waitForSelector('input[name="account"]', { timeout: 20000 });
        await page.type('input[name="account"]', process.env.XIAOMI_USER, { delay: 100 });
        await page.type('input[name="password"]', process.env.XIAOMI_PASS, { delay: 100 });
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        log('✅ Авторизация завершена');
    }

    // Проверка на появление truste-consent-button
    try {
        await page.waitForSelector('button#truste-consent-button', { timeout: 5000 });
        await page.click('button#truste-consent-button');
        log('✅ Нажата кнопка truste-consent-button');
        await page.waitForTimeout(1000);
    } catch (err) {
        log('ℹ️ Кнопка truste-consent-button не появилась');
    }

    // Проверка на появление окна Accept All
    try {
        await page.waitForSelector('a.acceptAllButtonLower', { timeout: 5000 });
        await page.click('a.acceptAllButtonLower');
        log('✅ Нажата кнопка Accept All');
        await page.waitForTimeout(1000);
    } catch (err) {
        log('ℹ️ Кнопка Accept All не появилась');
    }

    // Проверка на появление окна Close
    try {
        await page.waitForSelector('a.close#gwt-debug-close_id', { timeout: 5000 });
        await page.click('a.close#gwt-debug-close_id');
        log('✅ Закрыто всплывающее окно (Close)');
        await page.waitForTimeout(1000);
    } catch (err) {
        log('ℹ️ Кнопка Close не появилась');
    }

    // Перейти на главную страницу постов снова после логина
    await page.goto('https://c.mi.com/global/forum-type/ALL', { waitUntil: 'networkidle2' });

    await page.evaluate(() => window.scrollBy(0, 500));
    // await page.waitForSelector('div.desc', { timeout: 20000 });
    // await page.click('div.desc');
    // await new Promise(resolve => setTimeout(resolve, 2000));

    await page.waitForSelector('div.like-btn', { timeout: 20000 });
    // const likeButtons = await page.$$('div.text-box.icon-like');
    const likeButtons = await page.$$('div.like-btn');
    for (let i = 0; i < Math.min(3, likeButtons.length); i++) {
        try {
            await likeButtons[i].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
            log(`Не удалось лайкнуть пост ${i + 1}: ${err}`);
        }
    }

    // const postLinks = await page.$$('a.forumSubLi.item-enter-done');
    // const postImages = await page.$$('div.forum-feed-item-content');
    const postImages = await page.$$('div.m-thread-img-content');
    for (let i = 0; i < 3; i++) {
        try {
            await page.waitForSelector('div.m-thread-img-content', { timeout: 10000 });
            const posts = await page.$$('div.m-thread-img-content');
            if (!posts[i]) {
                log(`⚠️ Пост #${i + 1} не найден`);
                continue;
            }

            log(`▶ Кликаем по посту #${i + 1}`);

            const prevUrl = page.url();
            await page.evaluate(el => el.click(), posts[i]);

            await page.waitForFunction(
                url => window.location.href !== url,
                { timeout: 10000 },
                prevUrl
            );

            log(`✅ Перешли к посту #${i + 1}`);
            await new Promise(resolve => setTimeout(resolve, 3000));

            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Комментарий
            try {
                await page.click('textarea.m-reply-box-content-input');
                await page.waitForSelector('div.ql-editor[contenteditable="true"]', { timeout: 5000 });

                const comments = [/* список комментариев */];
                const comment = comments[Math.floor(Math.random() * comments.length)];

                await page.evaluate((text) => {
                    const editor = document.querySelector('div.ql-editor[contenteditable=\"true\"]');
                    if (editor) editor.innerHTML = `<p>${text}</p>`;
                }, comment);

                await page.click('div.ql-send-btn');
                log(`✅ Комментарий к посту #${i + 1} отправлен`);
            } catch (err) {
                log(`❌ Ошибка при комментировании поста #${i + 1}: ${err}`);
            }

            // Follow
            try {
                const followBtn = await page.$('div.follow-btn');
                if (followBtn) {
                    await followBtn.click();
                    log(`➕ Подписка на автора поста #${i + 1}`);
                } else {
                    log(`⚠️ Кнопка Follow не найдена на посте #${i + 1}`);
                }
            } catch (err) {
                log(`⚠️ Не удалось подписаться на автора поста #${i + 1}: ${err}`);
            }

            await page.goBack({ waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (err) {
            log(`❌ Ошибка при переходе к посту #${i + 1}: ${err}`);
        }
    }
})();
