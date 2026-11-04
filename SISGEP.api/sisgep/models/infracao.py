from django.db import models


class Infracao(models.Model):
    codigo = models.CharField(max_length=50, unique=True)
    descricao = models.TextField()
