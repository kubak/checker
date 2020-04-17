const config = require('./config.json')

const puppeteer = require('puppeteer')
const screenshot = 'screenshot.png'

const check = () => {
   try {
      (async () => {
         console.log('launching browser')
         const browser = await puppeteer.launch()
         const page = await browser.newPage()
         await page.setViewport({ width: 1280, height: 800 })

         await page.goto('https://ezakupy.tesco.pl/groceries/')
         await page.waitForSelector('.signin-register--signin-button .button')
         await page.click('.signin-register--signin-button .button')

         await page.waitForSelector('.smart-submit-button .button')
         await page.type('#email', config.email)
         await page.type('#password', config.password)
         await page.click('.smart-submit-button .button');

         await page.waitForSelector('.action .button')
         await page.click('.action .button')

         await page.waitForSelector('.slot-context-card--checkout .button');

         let available = await page.$$('.slot-grid--item.available input[name="start"]')
         console.log('first week', available.length);
         if (available.length === 0) {
            let weekTabs = await page.$$('.slot-selector--week-tabheader-link')
            await weekTabs[1].click()
            await page.waitFor('.slot-selector--week-tabheader:nth-of-type(2).active')
            available = await page.$$('.slot-grid--item.available input[name="start"]')
            console.log('second week', available.length);
            if (available.length === 0) {
               await weekTabs[2].click()
               await page.waitFor('.slot-selector--week-tabheader:nth-of-type(3).active')
               available = await page.$$('.slot-grid--item.available input[name="start"]')
               console.log('third week', available.length);
            }
         }
         if (available.length !== 0) {

            let acc = available.splice(0, 1)[0];
            for (const el of available) {
               debugger;
               const accValue = await acc.evaluate( node => node.value )
               const elValue = await el.evaluate( node => node.value )
               acc = (new Date(accValue) > new Date(elValue) ? el : acc)
            }
            const firstDate = await acc.evaluate( node => node.value )
            const parentEl = (await acc.$x('..'))[0];
            const secondDateEl = (await parentEl.$x('input[@name="end"]'))[0]
            const secondDate = await secondDateEl.evaluate( node => node.value )

            const dateButton = (await parentEl.$x('button'))[0]

            console.log('pierwsza data od :' + firstDate + ' do ' + secondDate)
            console.log('rezerwuje')

            await dateButton.hover()
            await dateButton.click()
            await page.screenshot({path: screenshot})
            console.log('see screenshot: ' + screenshot)
            await browser.close()
            process.exit()

         } else {
            console.log('pyta jest probojemy za : ' + config.interval + 'ms');
            setTimeout(check, config.interval);
         }

      })()
   } catch (err) {
     console.error(err)
   }
}

check();