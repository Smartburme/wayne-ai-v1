---
knowledge_type: linguistic
engine: y-npl-text-v4
version: 3.0.0
last_updated: 2024-01-20
language_support: [en, my, zxx]
---

# စာသားအချက်အလက်အရင်းအမြစ်များ (100 ခု)

## အထွေထွေဗဟုသုတ
1. [Wikipedia](https://www.wikipedia.org) - အခမဲ့စွယ်စုံကျမ်း  
   `language: 300+ | reliability: 0.95`

2. [Encyclopedia Britannica](https://www.britannica.com) - အတည်ပြုထားသောအချက်အလက်များ  
   `categories: [academic, verified]`

3. [WikiHow](https://www.wikihow.com) - လက်တွေ့လုပ်ဆောင်နည်းလမ်းညွှန်များ  
   `tutorials: 200,000+`

4. [Khan Academy](https://www.khanacademy.org) - ပညာရေးအရင်းအမြစ်များ  
   `subjects: 50+`

5. [Project Gutenberg](https://www.gutenberg.org) - အခမဲ့အီဘွတ်ခ်များ  
   `books: 60,000+`

6. [Internet Archive](https://archive.org) - ဒစ်ဂျစ်တယ်စာကြည့်တိုက်  
   `collections: 40M+`

7. [Open Library](https://openlibrary.org) - စာအုပ်ကက်တလောက်  
   `records: 20M+`

8. [HowStuffWorks](https://www.howstuffworks.com) - ရှင်းလင်းချက်ဆောင်းပါးများ  
   `topics: 1,000+`

9. [TED-Ed](https://ed.ted.com) - ပညာရေးဗီဒီယိုများ  
   `lessons: 1,500+`

10. [MIT OpenCourseWare](https://ocw.mit.edu) - သင်တန်းပစ္စည်းများ  
    `courses: 2,500+`

## သိပ္ပံနှင့်နည်းပညာ
11. [ScienceDirect](https://www.sciencedirect.com)  
12. [ResearchGate](https://www.researchgate.net)  
13. [Google Scholar](https://scholar.google.com)  
14. [JSTOR](https://www.jstor.org)  
15. [PLOS](https://plos.org)  
16. [PubMed](https://pubmed.ncbi.nlm.nih.gov)  
17. [ArXiv](https://arxiv.org)  
18. [IEEE Xplore](https://ieeexplore.ieee.org)  
19. [SpringerLink](https://link.springer.com)  
20. [Nature](https://www.nature.com)

## ကျန်းမာရေး
21. [World Health Organization](https://www.who.int)  
22. [CDC](https://www.cdc.gov)  
23. [Mayo Clinic](https://www.mayoclinic.org)  
24. [WebMD](https://www.webmd.com)  
25. [MedlinePlus](https://medlineplus.gov)  
26. [Healthline](https://www.healthline.com)  
27. [Verywell Health](https://www.verywellhealth.com)  
28. [Medical News Today](https://www.medicalnewstoday.com)  
29. [Psychology Today](https://www.psychologytoday.com)  
30. [American Psychological Association](https://www.apa.org)

## အနုပညာနှင့်ယဉ်ကျေးမှု
31. [Google Arts & Culture](https://artsandculture.google.com)  
32. [The British Museum](https://www.britishmuseum.org)  
33. [Louvre](https://www.louvre.fr)  
34. [Metropolitan Museum of Art](https://www.metmuseum.org)  
35. [Smithsonian](https://www.si.edu)  
36. [WikiArt](https://www.wikiart.org)  
37. [Artsy](https://www.artsy.net)  
38. [ArtStation](https://www.artstation.com)  
39. [DeviantArt](https://www.deviantart.com)  
40. [Behance](https://www.behance.net)

## မြန်မာဘာသာဆိုင်ရာ
91. [မြန်မာဝီကီ](https://my.wikipedia.org)  
92. [မြန်မာ့စွယ်စုံကျမ်း](http://www.myanmarecyclopedia.org)  
93. [မြန်မာ့ယဉ်ကျေးမှု](http://www.myanmarculture.org)  
94. [မြန်မာစာပေ](http://www.myanmarliterature.com)  
95. [မြန်မာ့ရိုးရာဆေးပညာ](http://www.myanmartraditionalmedicine.org)  
96. [မြန်မာနိုင်ငံဆိုင်ရာအချက်အလက်](http://www.myanmarfacts.org)  
97. [မြန်မာ့သဘာဝပတ်ဝန်းကျင်](http://www.myanmarenvironment.org)  
98. [မြန်မာနည်းပညာ](http://www.myanmartechnology.org)  
99. [မြန်မာ့သမိုင်း](http://www.myanmarhistory.net)  
100. [မြန်မာ့ပညာရေး](http://www.myanmareducation.edu.mm)

## NLP ချိတ်ဆက်နည်း
```python
def load_text_resources():
    """Y-NPL engine integration for text knowledge"""
    resources = []
    for source in knowledge_base:
        if 'my' in source.get('language_support', []):
            resources.append({
                'name': source['name'],
                'url': source['url'],
                'reliability': source.get('reliability', 0.8)
            })
    return sorted(resources, key=lambda x: x['reliability'], reverse=True)
