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
    const postImages = await page.$$('img.thread-img-single');

    for (let i = 0; i < Math.min(3, postImages.length); i++) {
        try {
            log(`▶ Кликаем по посту #${i + 1}`);
            await postImages[i].click();
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
            await new Promise(resolve => setTimeout(resolve, 3000));

            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
                await page.click('textarea.m-reply-box-content-input');
                const comments = [
                    'Wow', 'Nice', 'Awesome', 'Cool', 'Great', 'Top', 'Love', 'Thanks', 'Useful', 'Helpful',
                    'Вау', 'Красиво', 'Инфа', 'Супер', 'Годно', 'Лайк', 'Круто', 'Годнота', 'Интересно', 'Полезно',
                    'Неверагодна', 'Цудоўна', 'Класна', 'Дзякуй', 'Прыгожа', 'Шчыра', 'Добра', 'Чудо', 'Залётна', 'Сонечна'
                ];
                const comment = comments[Math.floor(Math.random() * comments.length)];
                await page.keyboard.type(comment);
                await page.click('div.ql-send-btn');
                log(`✅ Комментарий к посту #${i + 1} отправлен`);
            } catch (err) {
                log(`❌ Ошибка при комментировании поста #${i + 1}: ${err}`);
            }

            try {
                await page.click('div.follow-btn');
                log(`➕ Подписка на автора поста #${i + 1}`);
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
