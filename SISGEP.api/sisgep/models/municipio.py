from django.db import models


class MunicipioApreensao(models.Model):
    nome = models.CharField(max_length=255)
    uf = models.CharField(max_length=2)
