from PIL import Image

SRC = r"C:\Users\aniss\lemon-market-frontend\src\assets\market\market-evening.webp"
OUT = r"C:\Users\aniss\lemon-market-frontend\src\assets\market\market-evening-uniform.webp"

im = Image.open(SRC).convert("RGB")

# Template: stall 1 (Zitronen-Sorbet tent) — self-contained, no animal, simplest.
# Bottom extended to y=505 (was 476) to also cover the other stalls'
# customers' feet/shoes, which poked out below their own dim boxes.
TPL_BOX = (234, 186, 436, 505)
tpl = im.crop(TPL_BOX)

# Each target's ORIGINAL dim box (STALL_SLOTS[i].dim from marketScene.ts),
# bottom extended the same way — pasting into exactly the area the old stall
# occupied means the paste edges land on the same background (sky/ground)
# the original art already transitioned on, instead of cutting into a
# neighboring stall's content.
DIM_BOXES = {
    0: (8, 196, 230, 505),
    2: (444, 204, 616, 505),
    3: (628, 196, 828, 505),
}

out = im.copy()
for idx, (x0, y0, x1, y1) in DIM_BOXES.items():
    w, h = x1 - x0, y1 - y0
    resized = tpl.resize((w, h), Image.LANCZOS)
    out.paste(resized, (x0, y0))

out.save(OUT, quality=92)
print("saved", OUT, out.size)
