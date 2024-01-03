# syntax=docker/dockerfile:1

FROM python:3.11-slim-bookworm

WORKDIR /python-docker

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

COPY . .

CMD ["flask", "run", "--debug", "--host=0.0.0.0"]