from django.conf import settings
from django.core.files.storage import storages


def documents_storage():
    return storages['documents']


if settings.USE_CLOUDINARY:
    from time import time

    from cloudinary.utils import private_download_url
    from cloudinary_storage.storage import RawMediaCloudinaryStorage

    class SignedRawCloudinaryStorage(RawMediaCloudinaryStorage):
        def url(self, name):
            public_id = self._prepend_prefix(self._normalise_name(name))
            file_format = name.rsplit('.', 1)[-1] if '.' in name else None
            return private_download_url(
                public_id,
                file_format,
                resource_type='raw',
                type='upload',
                secure=True,
                expires_at=int(time()) + 600,
            )
