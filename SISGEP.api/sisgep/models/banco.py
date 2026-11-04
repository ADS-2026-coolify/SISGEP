from django.db import models


class Banco(models.Model):
    nome = models.CharField(max_length=255)
    cnpj = models.CharField(max_length=18, unique=True)
    telefone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    guincho_padrao = models.DecimalField(max_digits=10, decimal_places=2)
    diaria_padrao = models.DecimalField(max_digits=10, decimal_places=2)
