FROM node:22-alpine AS frontend-build

WORKDIR /build/SISGEP.web

COPY SISGEP.web/package.json SISGEP.web/package-lock.json ./
RUN npm ci

COPY SISGEP.web/ ./

ARG VITE_API_URL=/api/auth/
ARG VITE_ASSET_BASE=/static/
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_ASSET_BASE=${VITE_ASSET_BASE}
RUN npm run build

FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY SISGEP.api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY SISGEP.api/ ./
COPY --from=frontend-build /build/SISGEP.web/dist/ ./frontend/

RUN SECRET_KEY=build-only-not-for-runtime python manage.py collectstatic --noinput \
    && python -c "import re; from pathlib import Path; root = Path('/app/staticfiles'); html = Path('/app/frontend/index.html').read_text(encoding='utf-8'); assets = re.findall(r'(?:src|href)=\"/static/([^\"]+)\"', html); missing = [asset for asset in assets if not (root / asset).is_file()]; assert not missing, f'Missing collected frontend assets: {missing}'"

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers ${GUNICORN_WORKERS:-3}"]
