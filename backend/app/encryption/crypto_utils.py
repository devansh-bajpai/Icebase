"""
Cryptographic utilities for RSA handshake and AES encryption
"""
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os
import base64
import json


class CryptoManager:
    """Manages RSA and AES encryption for socket communication"""
    
    def __init__(self):
        self.backend = default_backend()
        self.rsa_private_key = None
        self.rsa_public_key = None
        self.rsa_public_key_pem = None
        self._generate_rsa_keys()
    
    def _generate_rsa_keys(self):
        """Generate RSA key pair for handshake"""
        self.rsa_private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=self.backend
        )
        self.rsa_public_key = self.rsa_private_key.public_key()
        self.rsa_public_key_pem = self.rsa_public_key.serialize(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')
    
    def get_public_key(self):
        """Get RSA public key in PEM format"""
        return self.rsa_public_key_pem
    
    def decrypt_rsa(self, encrypted_data: bytes) -> bytes:
        """Decrypt data using RSA private key"""
        try:
            decrypted = self.rsa_private_key.decrypt(
                encrypted_data,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            return decrypted
        except Exception as e:
            raise ValueError(f"RSA decryption failed: {str(e)}")
    
    @staticmethod
    def generate_aes_key() -> bytes:
        """Generate a random 256-bit AES key"""
        return os.urandom(32)  # 32 bytes = 256 bits
    
    @staticmethod
    def encrypt_aes(plaintext: bytes, key: bytes, iv: bytes = None) -> tuple:
        """Encrypt data using AES-256-CBC
        
        Returns:
            tuple: (encrypted_data, iv) both as base64 strings
        """
        if iv is None:
            iv = os.urandom(16)  # 16 bytes = 128 bits for AES block size
        
        cipher = Cipher(
            algorithms.AES(key),
            modes.CBC(iv),
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        
        # Pad plaintext to be multiple of block size
        pad_length = 16 - (len(plaintext) % 16)
        padded_plaintext = plaintext + bytes([pad_length] * pad_length)
        
        ciphertext = encryptor.update(padded_plaintext) + encryptor.finalize()
        
        return (
            base64.b64encode(ciphertext).decode('utf-8'),
            base64.b64encode(iv).decode('utf-8')
        )
    
    @staticmethod
    def decrypt_aes(encrypted_data_b64: str, iv_b64: str, key: bytes) -> bytes:
        """Decrypt data using AES-256-CBC
        
        Args:
            encrypted_data_b64: Base64 encoded encrypted data
            iv_b64: Base64 encoded initialization vector
            key: AES key as bytes
            
        Returns:
            Decrypted plaintext as bytes
        """
        try:
            ciphertext = base64.b64decode(encrypted_data_b64)
            iv = base64.b64decode(iv_b64)
            
            cipher = Cipher(
                algorithms.AES(key),
                modes.CBC(iv),
                backend=default_backend()
            )
            decryptor = cipher.decryptor()
            
            padded_plaintext = decryptor.update(ciphertext) + decryptor.finalize()
            
            # Remove padding
            pad_length = padded_plaintext[-1]
            plaintext = padded_plaintext[:-pad_length]
            
            return plaintext
        except Exception as e:
            raise ValueError(f"AES decryption failed: {str(e)}")
    
    @staticmethod
    def decrypt_encrypted_payload(encrypted_payload: dict, key: bytes) -> dict:
        """Decrypt a JSON payload that was encrypted with AES
        
        Args:
            encrypted_payload: Dictionary with 'data' and 'iv' keys (both base64)
            key: AES key as bytes
            
        Returns:
            Decrypted dictionary
        """
        encrypted_data = encrypted_payload.get('data')
        iv = encrypted_payload.get('iv')
        
        if not encrypted_data or not iv:
            raise ValueError("Missing 'data' or 'iv' in encrypted payload")
        
        decrypted_bytes = CryptoManager.decrypt_aes(encrypted_data, iv, key)
        return json.loads(decrypted_bytes.decode('utf-8'))


# Global crypto manager instance
crypto_manager = CryptoManager()

