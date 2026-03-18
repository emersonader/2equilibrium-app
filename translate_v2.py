#!/usr/bin/env python3
"""Translate 2Equilibrium lessons one at a time using Gemini CLI."""
import json, subprocess, sys, os, time

APP = '/Volumes/ExternalHome/Grumpy/openclaw-workspace/2equilibrium-app/app'

def get_untranslated(en_data, lang_data):
    untranslated = []
    for i, lesson in enumerate(lang_data['lessons']):
        if en_data['lessons'][i]['content']['introduction'] == lesson['content']['introduction']:
            untranslated.append(i)
    return untranslated

def translate_one(en_data, lang_data, idx, lang_code):
    l = en_data['lessons'][idx]
    day = l['dayNumber']
    
    lang_desc = "Latin American Spanish" if lang_code == "es" else "Brazilian Portuguese"
    
    # Send just the fields we need translated, one lesson at a time
    content = {
        'introduction': l['content']['introduction'],
        'mainContent': l['content']['mainContent'],
        'keyTakeaways': l['content']['keyTakeaways'],
        'actionStep': l['content']['actionStep'],
        'journalPrimary': l['journalPrompt']['primary']
    }
    
    prompt = f"""Translate this wellness lesson to {lang_desc}. Return ONLY valid JSON object with same keys. Preserve markdown. Warm coaching tone.

{json.dumps(content, ensure_ascii=False)}"""
    
    try:
        result = subprocess.run(
            ['gemini', '-m', 'gemini-2.5-flash', prompt],
            capture_output=True, text=True, timeout=120
        )
    except subprocess.TimeoutExpired:
        return False
    
    if result.returncode != 0:
        return False
    
    output = result.stdout.strip()
    start = output.find('{')
    end = output.rfind('}') + 1
    if start == -1 or end == 0:
        return False
    
    try:
        t = json.loads(output[start:end])
    except json.JSONDecodeError:
        return False
    
    # Apply
    lang_data['lessons'][idx]['content']['introduction'] = t.get('introduction', content['introduction'])
    lang_data['lessons'][idx]['content']['mainContent'] = t.get('mainContent', content['mainContent'])
    lang_data['lessons'][idx]['content']['keyTakeaways'] = t.get('keyTakeaways', content['keyTakeaways'])
    lang_data['lessons'][idx]['content']['actionStep'] = t.get('actionStep', content['actionStep'])
    lang_data['lessons'][idx]['journalPrompt']['primary'] = t.get('journalPrimary', content['journalPrimary'])
    return True

def main():
    lang_code = sys.argv[1] if len(sys.argv) > 1 else 'es'
    lang_name = 'Spanish' if lang_code == 'es' else 'Portuguese'
    
    with open(f'{APP}/src/data/content/lessons.json') as f:
        en_data = json.load(f)
    
    target_file = f'{APP}/src/i18n/locales/{lang_code}/lessons.json'
    with open(target_file) as f:
        lang_data = json.load(f)
    
    untranslated = get_untranslated(en_data, lang_data)
    total = len(untranslated)
    print(f"{lang_name}: {total} lessons to translate")
    
    done = 0
    errors = 0
    for idx in untranslated:
        day = en_data['lessons'][idx]['dayNumber']
        print(f"  Day {day}...", end=' ', flush=True)
        
        ok = translate_one(en_data, lang_data, idx, lang_code)
        if ok:
            done += 1
            print("✅")
        else:
            errors += 1
            print("❌")
        
        # Save every 5 lessons
        if done % 5 == 0:
            with open(target_file, 'w') as f:
                json.dump(lang_data, f, indent=2, ensure_ascii=False)
        
        time.sleep(0.5)
    
    # Final save
    with open(target_file, 'w') as f:
        json.dump(lang_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n{lang_name}: {done} translated, {errors} errors. Total: {180-total+done}/180")

if __name__ == '__main__':
    main()
