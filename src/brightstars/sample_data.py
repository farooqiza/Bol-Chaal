"""Offline templated calendar — lets you run the whole pipeline without an API key.

This is NOT AI output. It fills the real schedule with canned, brand-safe copy so
you can see the structure, test approval/publishing, and demo end-to-end offline.
Use `generate` for real AI content.
"""
from __future__ import annotations

from collections import defaultdict

from .models import DraftCalendar, DraftPost, Platform, PostFormat
from .schedule import build_slots

_DEFAULT_FORMAT = {
    Platform.facebook: PostFormat.feed,
    Platform.instagram: PostFormat.feed,
    Platform.linkedin: PostFormat.text,
}

# pillar -> list of (caption, image_prompt, cta, notes) variants
_COPY: dict[str, list[tuple[str, str, str, str]]] = {
    "parenting_tips": [
        ("Tantrum meltdown at the grocery store? 💛 Try the \"name it to tame it\" trick: "
         "calmly say what your child feels — \"You're really frustrated\" — before redirecting. "
         "Naming the emotion helps little brains settle.",
         "Soft flat-lay of a parenting tip card, crayons and a stuffed animal — no children's faces.",
         "Follow Bright Stars for weekly early-learning tips.", "No consent needed."),
        ("Reading at home doesn't need flashcards. 📚 Point to words on cereal boxes, signs, and "
         "menus — everyday print builds early reading more than any worksheet.",
         "Illustration of a parent and child reading a cereal box at breakfast, faces not shown.",
         "Visit brightstars.us to learn about our curriculum.", "No consent needed."),
    ],
    "inside_classroom": [
        ("This week our preschoolers explored colors with a sensory bin — scooping, sorting, and "
         "naming shades while building fine-motor skills and early math. Learning that feels like play. 🎨",
         "Close-up of a colorful sensory bin with scoops and cups on a classroom table — no children.",
         "Now enrolling — message us to book a tour.", "Photo must show materials only, no children."),
    ],
    "team_spotlight": [
        ("Meet the heart of Bright Stars: our teachers. Each one meets rigorous training requirements "
         "and keeps growing through professional development — because your child deserves educators who "
         "never stop learning. 💫",
         "Warm photo of a smiling teacher in a bright classroom (with that teacher's written consent).",
         "Call (303) 369-8880 to meet our team on a tour.", "Get written consent from the staff member featured."),
    ],
    "why_bright_stars": [
        ("What does a Level 4 Colorado Shines rating mean for your child? It's the state's 2nd-highest "
         "quality rating — earned by exceeding requirements for teacher training, ratios, and curriculum. "
         "In plain terms: more attention, better learning. ⭐",
         "Clean graphic with a 4-star badge and the words 'Level 4 Colorado Shines' — no children.",
         "Visit brightstars.us to see all our programs.", "No consent needed."),
        ("Worried about cost? We handle your CCCAP assistance paperwork for you, and we accept UPK & DPP "
         "funding. Quality care shouldn't be out of reach. 💛",
         "Simple illustration of a checklist titled 'We handle the paperwork' — no children.",
         "Ask us how UPK & DPP can lower your cost.", "No consent needed."),
    ],
    "enrollment_cta": [
        ("Now enrolling! 🌟 We have openings for infants, toddlers, and preschoolers in Aurora. "
         "Spots fill fast — book a tour this week and see why families stay with us for years.",
         "Bright, welcoming center entrance or play area with no children present.",
         "Call (303) 369-8880 to book a tour.", "No consent needed."),
    ],
    "community_seasonal": [
        ("Happy summer, Aurora families! ☀️ Looking for easy ways to keep little ones busy? "
         "Try a backyard water-play afternoon or a walk to spot every color of the rainbow.",
         "Cheerful summery flat-lay — sun hat, picture book, sidewalk chalk — no children.",
         "Follow us for more local family tips.", "No consent needed."),
    ],
    "hiring": [
        ("We're hiring! 🌟 Bright Stars is looking for caring early-childhood educators to join our "
         "Level 4 team in Aurora. Supportive culture, real growth, and the joy of shaping bright futures.",
         "Professional 'We're Hiring' graphic in brand colors — no children.",
         "Message us or call (303) 369-8880 to apply.", "No consent needed."),
    ],
}

_TAG_TOPIC = {
    "parenting_tips": "parenting", "inside_classroom": "parenting", "team_spotlight": "parenting",
    "why_bright_stars": "enrollment", "enrollment_cta": "enrollment",
    "community_seasonal": "enrollment", "hiring": "hiring",
}


def _hashtags(brand: dict, platform: Platform, pillar: str) -> list[str]:
    banks = brand["hashtags"]
    core = banks["core"]
    topic = banks["topical"].get(_TAG_TOPIC.get(pillar, "enrollment"), [])
    if platform == Platform.instagram:
        return (core + topic)[:8]
    if platform == Platform.linkedin:
        return (banks["topical"]["hiring"][:3] + core[:1]) if pillar == "hiring" else (topic[:2] + core[:1])
    return core[:1] + topic[:2]  # facebook: light


def generate_sample(brand: dict, year: int, month: int) -> DraftCalendar:
    slots = build_slots(brand, year, month)
    counters: dict[str, int] = defaultdict(int)
    posts: list[DraftPost] = []

    for s in slots:
        variants = _COPY.get(s.pillar) or _COPY["enrollment_cta"]
        caption, image_prompt, cta, notes = variants[counters[s.pillar] % len(variants)]
        counters[s.pillar] += 1
        posts.append(DraftPost(
            date=s.date,
            platform=s.platform,
            pillar=s.pillar,
            format=_DEFAULT_FORMAT[s.platform],
            caption=caption,
            hashtags=_hashtags(brand, s.platform, s.pillar),
            image_prompt=image_prompt,
            call_to_action=cta,
            notes=notes,
        ))

    return DraftCalendar(month=f"{year:04d}-{month:02d}", posts=posts)
