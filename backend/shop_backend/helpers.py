# helpers.py
def parse_address(raw_address):
    lines = raw_address.strip().split('\n')
    phone = lines[0] if len(lines) > 0 else ''
    location = "\n".join(lines[1:]) if len(lines) > 1 else ''
    return phone.strip(), location.strip()
