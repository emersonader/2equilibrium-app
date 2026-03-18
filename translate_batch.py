#!/usr/bin/env python3
"""Batch translate 2Equilibrium lessons using Gemini CLI."""
import json, subprocess, sys, os, time

APP = '/Volumes/ExternalHome/Grumpy/openclaw-workspace/2equilibrium-app/app'
BATCH_SIZE = 5  # Small batches to avoid timeouts

def get_untranslated(en_data, lang_data):
    """Find indices of untranslated lessons."""
    untranslated = []
    for i, lesson in enumerate(lang_data['lessons']):
        en_intro = en_data['lessons'][i]['content']['introduction']
        lang_intro = lesson['content']['introduction']
        if en_intro == lang_intro:
            untranslated.append(i)
    return untranslated

def translate_batch(en_data, lang_data, indices, lang_code, lang_name):
    """Translate a batch of lessons."""
    extract = []
    for idx in indices:
        l = en_data['lessons'][idx]
        extract.append({
            'dayNumber': l['dayNumber'],
            'introduction': l['content']['introduction'],
            'mainContent': l['content']['mainContent'],
            'keyTakeaways': l['content']['keyTakeaways'],
            'actionStep': l['content']['actionStep'],
            'journalPrimary': l['journalPrompt']['primary']
        })
    
    lang_desc = "Latin American Spanish" if lang_code == "es" else "Brazilian Portuguese (NOT European)"
    prompt = f"""Translate this wellness content to {lang_desc}. Return ONLY a valid JSON array. Keep dayNumber unchanged. Preserve markdown (**bold**, \\n). Warm, encouraging wellness tone.

{json.dumps(extract, ensure_ascii=False)}"""
    
    result = subprocess.run(
        ['gemini', '-m', 'gemini-2.5-flash', prompt],
        capture_output=True, text=True, timeout=300
    )
    
    if result.returncode != 0:
        print(f"  ERROR: {result.stderr[:200]}")
        return 0
    
    output = result.stdout.strip()
    start = output.find('[')
    end = output.rfind(']') + 1
    if start == -1 or end == 0:
        print(f"  ERROR: No JSON in output")
        return 0
    
    try:
        translated = json.loads(output[start:end])
    except json.JSONDecodeError as e:
        print(f"  ERROR: JSON parse: {e}")
        return 0
    
    # Apply translations
    applied = 0
    for t in translated:
        day = t['dayNumber']
        for i, l in enumerate(lang_data['lessons']):
            if l['dayNumber'] == day:
                lang_data['lessons'][i]['content']['introduction'] = t['introduction']
                lang_data['lessons'][i]['content']['mainContent'] = t['mainContent']
                lang_data['lessons'][i]['content']['keyTakeaways'] = t['keyTakeaways']
                lang_data['lessons'][i]['content']['actionStep'] = t['actionStep']
                lang_data['lessons'][i]['journalPrompt']['primary'] = t['journalPrimary']
                applied += 1
                break
    
    return applied

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
    print(f"{lang_name}: {total} lessons remaining")
    
    done = 0
    for i in range(0, total, BATCH_SIZE):
        batch = untranslated[i:i + BATCH_SIZE]
        days = [en_data['lessons'][idx]['dayNumber'] for idx in batch]
        print(f"  Translating days {days[0]}-{days[-1]}...", end=' ', flush=True)
        
        count = translate_batch(en_data, lang_data, batch, lang_code, lang_name)
        done += count
        print(f"✅ ({count} lessons)")
        
        # Save after each batch
        with open(target_file, 'w') as f:
            json.dump(lang_data, f, indent=2, ensure_ascii=False)
        
        time.sleep(1)  # Brief pause between API calls
    
    print(f"\n{lang_name}: {done}/{total} translated. Total done: {180 - total + done}/180")

if __name__ == '__main__':
    main()
