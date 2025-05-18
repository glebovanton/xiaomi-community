require('dotenv').config();
const puppeteer = require('puppeteer');

(async () => {
    if (!process.env.CUSERID || !process.env.TOKEN) {
        throw new Error('❌ CUSERID или TOKEN не заданы. Установи переменные окружения!');
    }

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox'],
        defaultViewport: {
            width: 390,
            height: 844, // как Redmi Note 12 Pro
            isMobile: true,
            hasTouch: true
        }
    });

    const page = await browser.newPage();

    await page.setUserAgent(
        'Mozilla/5.0 (Linux; Android 12; Redmi Note 12 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
    );

    // Авторизационные куки
    await page.setCookie(
        {
            name: 'cUserId',
            value: process.env.CUSERID,
            domain: '.mi.com',
            path: '/',
            httpOnly: false,
            secure: true
        },
        {
            name: 'new_bbs_serviceToken',
            value: process.env.TOKEN,
            domain: '.mi.com',
            path: '/',
            httpOnly: false,
            secure: true
        }
    );

    // Перейти на главную страницу постов
    await page.goto('https://c.mi.com/global/forum-type/ALL', { waitUntil: 'networkidle2' });

    // Кликнуть по "Latest post"
    await page.waitForSelector('div.desc', { timeout: 10000 });
    await page.click('div.desc');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Лайкнуть 3 последних поста
    const likeButtons = await page.$$('div.text-box.icon-like');
    for (let i = 0; i < Math.min(3, likeButtons.length); i++) {
        try {
            await likeButtons[i].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
            console.error(`Не удалось лайкнуть пост ${i + 1}`, err);
        }
    }

    // Открыть 3 последних поста, прочитать, прокомментировать и зафоловить
    const postLinks = await page.$$('a.forumSubLi.item-enter-done');
    for (let i = 0; i < Math.min(3, postLinks.length); i++) {
        const href = await postLinks[i].evaluate(a => a.getAttribute('href'));
        const postUrl = `https://c.mi.com${href}`;

        await page.goto(postUrl, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 3000));

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            await page.click('div.ql-editor');
            const comments = [
                'Wow', 'Nice', 'Awesome', 'Cool', 'Great', 'Top', 'Love', 'Thanks', 'Useful', 'Helpful',
                'Вау', 'Красиво', 'Инфа', 'Супер', 'Годно', 'Лайк', 'Круто', 'Годнота', 'Интересно', 'Полезно',
                'Неверагодна', 'Цудоўна', 'Класна', 'Дзякуй', 'Прыгожа', 'Шчыра', 'Добра', 'Чудо', 'Залётна', 'Сонечна'
            ];
            const comment = comments[Math.floor(Math.random() * comments.length)];
            await page.keyboard.type(comment);
            await page.click('div.ql-send-btn');
            console.log(`✅ Комментарий к посту #${i + 1} отправлен`);
        } catch (err) {
            console.error(`❌ Ошибка при комментировании поста #${i + 1}`, err);
        }

        try {
            await page.click('div.follow-btn');
            console.log(`➕ Подписка на автора поста #${i + 1}`);
        } catch (err) {
            console.error(`⚠️ Не удалось подписаться на автора поста #${i + 1}`, err);
        }

        await page.goBack({ waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await browser.close();
})();
