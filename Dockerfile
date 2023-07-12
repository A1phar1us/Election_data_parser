# Базовый образ
FROM python:3.9-slim

# Установка рабочего каталога в контейнере
WORKDIR /usr/src/app

# Установка Node.js и wget
RUN apt-get update && apt-get install -y curl wget xz-utils
RUN curl -fsSL https://nodejs.org/dist/v14.17.1/node-v14.17.1-linux-x64.tar.xz -o node-v14.17.1-linux-x64.tar.xz
RUN tar -xJf node-v14.17.1-linux-x64.tar.xz -C /usr/local --strip-components=1
RUN rm node-v14.17.1-linux-x64.tar.xz

# RUN node -v
# RUN npm -v

# Установка Chrome и ChromeDriver
RUN apt-get install -yqq unzip
RUN wget -O /tmp/chromedriver.zip http://chromedriver.storage.googleapis.com/`curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE`/chromedriver_linux64.zip
RUN unzip /tmp/chromedriver.zip chromedriver -d /usr/local/bin/
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN dpkg -i google-chrome-stable_current_amd64.deb; apt-get -fy install

# Установка зависимостей Python
RUN pip install selenium

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей Node.js
RUN npm install
RUN npm install express
RUN npm install socket.io

# Копирование остального кода в контейнер
COPY . .

# Открытие порта, на котором будет работать приложение
EXPOSE 3000

# Команда для запуска приложения при запуске контейнера
CMD [ "node", "server.js" ]

