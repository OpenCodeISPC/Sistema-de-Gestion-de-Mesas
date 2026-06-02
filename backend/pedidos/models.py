from django.db import models

class Pedido(models.Model):
    pass









    class Meta:
        db_table = "pedidos"
        
        
    def __str__(self):
        return f""    
    
    
    
class DetallePedido(models.Model):
    pass



    class Meta:
        db_table = "detalle_pedidos"
    
    
    def __str__(self):
        return f""
    
