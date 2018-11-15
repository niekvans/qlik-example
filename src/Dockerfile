FROM library/node:slim
RUN apt-get update && apt-get -y install git

COPY . /app

WORKDIR /app

CMD ["bash","bootstrap.sh"]