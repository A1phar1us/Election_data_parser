# -*- coding: utf-8 
import time
import random
import csv
import re
import json
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument("--headless") 
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
driver = webdriver.Chrome(options=options)
driver.get("http://www.st-petersburg.vybory.izbirkom.ru/st-petersburg/ik_r/")

with open('/usr/src/app/results/uik_ids.csv', 'w', newline='', encoding='utf-8') as uik_file:
    uik_writer = csv.writer(uik_file)

    # Ждем появления TИKов на странице
    WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.XPATH, '//ul[@role="group"]/li[@role="treeitem"]')))
    time.sleep(5)
    
    # Раскрываем все ТИКи сразу с помощью JavaScript
    driver.execute_script("""
        var arrows = document.querySelectorAll('.jstree-icon.jstree-ocl');
        for(var i=1; i<arrows.length; i++) {
            arrows[i].click();
        }
    """)
    time.sleep(15)

    message = 'Start getting UIKs'
    print(json.dumps({'type': 'message', 'content': message}))
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.XPATH, '//a[contains(text(), "УИК №")]')))
    
    uiks = driver.find_elements(By.XPATH, '//a[contains(text(), "УИК №")]')
    total_uiks = len(uiks)
    for index, uik in enumerate(uiks):
        uik_number = re.search(r"УИК №(\d+)", uik.text).group(1)
        uik_writer.writerow([uik_number])
        progress = (index + 1) / total_uiks * 100  # Расчет прогресса в процентах
        message = f'Processing UIK {index+1} of {total_uiks}'  # Сообщение о текущем состоянии процесса
        sys.stdout.write(json.dumps({'type': 'progress', 'content': progress, 'message': message}))  # Выводим прогресс и сообщение
        sys.stdout.flush()

driver.quit()
message = 'Completed'
print(json.dumps({'type': 'completed', 'message': message}))

