import os
from pathlib import Path
from dotenv import load_dotenv

# Construye rutas dentro del proyecto de esta manera: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Carga variables desde .env.desarrollo
ENV_FILE = os.path.join(BASE_DIR, '.env.desarrollo')
if os.path.exists(ENV_FILE):
    load_dotenv(ENV_FILE)
else:
    #si no existe, cae por defecto en el .env estandar
    load_dotenv(os.path.join(BASE_DIR, '.env'))    

# Configuración de desarrollo de inicio rápido: no apta para producción.
# See https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/

# ADVERTENCIA DE SEGURIDAD: ¡mantenga en secreto la clave secreta utilizada en producción!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-default-key')

# ADVERTENCIA DE SEGURIDAD: ¡no ejecute con la depuración activada en producción!
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    #libreria de terceros para conectar con angular
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    
    # Mis aplicaciones locales
    'productos',
    'mesas',
    'pedidos',
    'usuarios',
]

AUTH_USER_MODEL = "usuarios.Usuario"


MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'gestion_de_mesas.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'gestion_de_mesas.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.postgresql'),
        'NAME': os.getenv('DB_NAME', 'sgmb_db'),
        'USER': os.getenv('DB_USER', 'sgmb_user'),
        'PASSWORD': os.getenv('DB_PASSWORD', '1234'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5434'),
    }
}

# Configuración MongoDB
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://sgmb_user:1234@localhost:27018/sgmb_mongo_db?authSource=admin')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'sgmb_mongo_db')


# Permitir peticiones HTTP desde el frontend de Angular
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:4200').split(',')

# =====================================
# REST FRAMEWORK - AUTENTICACIONES
# =====================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/
# **Dejar estos parametros para que guarde bien los datos en la bd

LANGUAGE_CODE = "en-us"
#controla la hora que ves al trabajar desde Django (conversión de salida/entrada).
TIME_ZONE = "America/Argentina/Buenos_Aires"
USE_I18N = True
#controla cómo se guarda físicamente en la base (siempre UTC, sea cual sea el TIME_ZONE).
USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'
