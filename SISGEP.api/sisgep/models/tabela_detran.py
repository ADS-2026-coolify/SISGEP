from django.db import models


class TabelaDetran(models.Model):
    guincho = models.DecimalField(max_digits=10, decimal_places=2)
    estadia = models.DecimalField(max_digits=10, decimal_places=2)
    ano_vigente = models.DateField()
