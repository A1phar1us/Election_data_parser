# -*- coding: utf-8 
import time
import csv
import json
import sys
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from multiprocessing import Pool

def process_uik(uik_id):
    options = Options()
    options.add_argument("--headless")  
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(options=options)
    uik_url = "http://www.st-petersburg.vybory.izbirkom.ru/st-petersburg/ik_r/" + uik_id

    data = []
    max_attempts = 80
    for attempt in range(1, max_attempts + 1):
        try:
            driver.get(uik_url)
            time.sleep(2)

            table = driver.find_element(By.XPATH, '//div[@class="table margtab"]//table')
            rows = table.find_elements(By.XPATH, './/tr[td or th]')

            for row in rows[1:]:
                cols = row.find_elements(By.TAG_NAME, 'td')
                number = cols[0].text
                fio = cols[1].text
                status = cols[2].text
                proposed_by = cols[3].text

                data.append([uik_id, number, fio, status, proposed_by])

            break  # Если исключений не было
        except Exception as e:
            print(f"Ошибка при обработке УИК с id {uik_id}, попытка {attempt}: {str(e)}")
            time.sleep(5)

            if attempt == max_attempts:
                with open('uik_ids_errors.csv', 'a', newline='', encoding='utf-8') as error_file:
                    writer = csv.writer(error_file)
                    writer.writerow([uik_id])
        finally:
            driver.quit()

    return data

if __name__ == '__main__':
    encoding = sys.argv[1] if len(sys.argv) > 1 else 'utf-8'  # получаем кодировку из аргументов командной строки
    num_processes = int(sys.argv[2]) if len(sys.argv) > 2 else 16    

    with open('/usr/src/app/results/uik_ids_errors.csv', 'w', newline='', encoding='utf-8') as _:
        pass  # Перезаписываем файл ошибок на каждом новом запуске

    with open('/usr/src/app/results/election_data.csv', 'w', newline='', encoding=encoding) as file, open('/usr/src/app/results/uik_ids.csv', 'r', newline='', encoding='utf-8') as uik_file:
        writer = csv.writer(file)
        reader = csv.reader(uik_file)

        writer.writerow(["УИК", "Номер", "ФИО", "Статус", "Кем предложен"])

        uik_ids = [row[0] for row in reader]
        total_uik_ids = len(uik_ids)

        with Pool(num_processes) as p:
            for i, result in enumerate(p.imap_unordered(process_uik, uik_ids), 1):
                for row in result:
                    writer.writerow(row)
                progress = (i / total_uik_ids) * 100
                message = f'Processing UIK {i} of {total_uik_ids}'
                sys.stdout.write(json.dumps({'type': 'progress', 'content': progress, 'message': message}))  # Выводим прогресс и сообщение
                sys.stdout.flush()

