import struct
import sys

def parse_mp4_dimensions(filename):
    with open(filename, 'rb') as f:
        data = f.read()
    
    # Search for 'tkhd' box
    idx = data.find(b'tkhd')
    if idx == -1:
        print("tkhd box not found")
        return None
    
    # tkhd box starts with 4-byte size, then 'tkhd' (4 bytes)
    # So idx points to 'tkhd'
    # The header size for tkhd is 8 bytes (4 size + 4 type)
    # The payload starts at idx + 4
    # version: idx + 4 (1 byte)
    version = data[idx + 4]
    
    # Offset of width and height in tkhd
    # If version is 1, creation time, modification time, duration are 64-bit (8 bytes each)
    # If version is 0, they are 32-bit (4 bytes each)
    if version == 1:
        # 1 byte version + 3 bytes flags = 4 bytes
        # 8 bytes creation time = 8 bytes
        # 8 bytes modification time = 8 bytes
        # 4 bytes track ID = 4 bytes
        # 4 bytes reserved = 4 bytes
        # 8 bytes duration = 8 bytes
        # 8 bytes reserved = 8 bytes
        # 2 bytes layer = 2 bytes
        # 2 bytes alternate group = 2 bytes
        # 2 bytes volume = 2 bytes
        # 2 bytes reserved = 2 bytes
        # 36 bytes matrix = 36 bytes
        # Total offset from idx + 4 = 4 + 8 + 8 + 4 + 4 + 8 + 8 + 2 + 2 + 2 + 2 + 36 = 88 bytes
        offset = idx + 4 + 88
    else:
        # 1 byte version + 3 bytes flags = 4 bytes
        # 4 bytes creation time = 4 bytes
        # 4 bytes modification time = 4 bytes
        # 4 bytes track ID = 4 bytes
        # 4 bytes reserved = 4 bytes
        # 4 bytes duration = 4 bytes
        # 8 bytes reserved = 8 bytes
        # 2 bytes layer = 2 bytes
        # 2 bytes alternate group = 2 bytes
        # 2 bytes volume = 2 bytes
        # 2 bytes reserved = 2 bytes
        # 36 bytes matrix = 36 bytes
        # Total offset from idx + 4 = 4 + 4 + 4 + 4 + 4 + 4 + 8 + 2 + 2 + 2 + 2 + 36 = 76 bytes
        offset = idx + 4 + 76
        
    width_fp = struct.unpack('>I', data[offset:offset+4])[0]
    height_fp = struct.unpack('>I', data[offset+4:offset+8])[0]
    
    # Width and height are 16.16 fixed point
    width = width_fp >> 16
    height = height_fp >> 16
    
    print(f"Dimensions: {width}x{height}")
    return width, height

if __name__ == "__main__":
    parse_mp4_dimensions(r"d:\Aiinterview\Untitled video (4).mp4")
