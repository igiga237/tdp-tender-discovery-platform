import os
from rest_framework import serializers
from .models import Document

ALLOWED_EXTENSIONS = ['.pdf', '.docx']
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ('id', 'file', 'uploaded_at')

    def validate_file(self, file):
        # Check file extension
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError("Unsupported file extension. Only PDF and DOCX files are allowed.")

        # Check file size
        if file.size > MAX_FILE_SIZE:
            raise serializers.ValidationError("File size exceeds the limit of 10MB.")
        
        return file

