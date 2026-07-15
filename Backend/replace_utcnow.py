import os
import glob

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    if 'datetime.utcnow()' not in content and 'datetime.utcnow' not in content:
        return
        
    print(f"Updating {filepath}")
    
    # Add timezone import if missing
    if 'from datetime import' in content and 'timezone' not in content:
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if line.startswith('from datetime import'):
                if 'timezone' not in line:
                    lines[i] = line + ', timezone'
                break
        content = '\n'.join(lines)
        
    content = content.replace('datetime.utcnow()', 'datetime.now(timezone.utc)')
    content = content.replace('datetime.utcnow', 'lambda: datetime.now(timezone.utc)')
    
    with open(filepath, 'w') as f:
        f.write(content)

for root, _, files in os.walk('app'):
    for file in files:
        if file.endswith('.py'):
            process_file(os.path.join(root, file))
