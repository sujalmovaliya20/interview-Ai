import os
import re

files = [
    'src/components/marketing/PricingSection.tsx',
    'src/components/marketing/Navbar.tsx',
    'src/components/marketing/HeroSection.tsx',
    'src/app/dashboard/page.tsx',
    'src/components/dashboard/CreditsWidget.tsx'
]

for file in files:
    path = os.path.join(r'd:\Aiinterview', file)
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace <Button with <Button nativeButton={false} if it contains render={<Link
    # We can match <Button and then look for render={<Link within the same tag.
    # A simpler regex:
    # Match `<Button [^>]*render={<Link[^>]*>[^<]*</Button>`
    
    def replacer(m):
        full_match = m.group(0)
        if 'nativeButton={false}' not in full_match:
            return full_match.replace('<Button', '<Button nativeButton={false}')
        return full_match
        
    content = re.sub(r'<Button[^>]*render={<Link[^>]*>[\s\S]*?</Button>', replacer, content)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Added nativeButton={false}!")
