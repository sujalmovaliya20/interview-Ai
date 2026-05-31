import os
import re

files = [
    'src/components/marketing/PricingSection.tsx',
    'src/components/marketing/Navbar.tsx',
    'src/components/marketing/HeroSection.tsx',
    'src/app/dashboard/page.tsx',
    'src/components/dashboard/CreditsWidget.tsx',
    'src/components/dashboard/Sidebar.tsx'
]

for file in files:
    path = os.path.join(r'd:\Aiinterview', file)
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    def replacer(m):
        btn_attrs = m.group(1)
        link_attrs = m.group(2)
        inner = m.group(3)
        return f'<Button{btn_attrs} render={{<Link{link_attrs} />}}>{inner}</Button>'
    
    content = re.sub(r'<Button([^>]*) asChild>\s*<Link([^>]*)>([\s\S]*?)</Link>\s*</Button>', replacer, content)

    content = re.sub(
        r'<SheetTrigger asChild>\s*<Button([^>]*)>([\s\S]*?)</Button>\s*</SheetTrigger>',
        r'<SheetTrigger render={<Button\1 />}>\2</SheetTrigger>',
        content
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Replaced all asChild usages!")
