from rest_framework import serializers

from ..models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Usuario
        fields = ['id', 'cpf', 'nome_completo', 'telefone', 'tipo_usuario', 'email', 'username', 'password']
        extra_kwargs = {
            'username': {'required': False, 'allow_blank': True},
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        username = validated_data.get('username') or validated_data.get('cpf')
        validated_data['username'] = username
        user = Usuario(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        if 'username' in validated_data and not validated_data['username']:
            validated_data['username'] = instance.cpf
        return super().update(instance, validated_data)
