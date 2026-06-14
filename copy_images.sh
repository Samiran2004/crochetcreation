#!/bin/bash
# Script to copy generated image assets into Next.js public/assets folder
# Run this from the repository root (e.g. /home/samiransamanta/Projects/Crochet Creation)

ASSETS_DIR="Crochet Creation_web/public/assets"
mkdir -p "$ASSETS_DIR"

echo "Copying generated image assets into $ASSETS_DIR..."

cp "/home/samiransamanta/.gemini/antigravity/brain/34937187-b14d-49df-bf59-e21551b43c86/marilyn_crafting_tools_1781361571906.png" "$ASSETS_DIR/marilyn_crafting_tools.png"
cp "/home/samiransamanta/.gemini/antigravity/brain/34937187-b14d-49df-bf59-e21551b43c86/marilyn_customer_alice_1781361648318.png" "$ASSETS_DIR/marilyn_customer_alice.png"
cp "/home/samiransamanta/.gemini/antigravity/brain/34937187-b14d-49df-bf59-e21551b43c86/marilyn_hero_yarn_1781361540256.png" "$ASSETS_DIR/marilyn_hero_yarn.png"
cp "/home/samiransamanta/.gemini/antigravity/brain/34937187-b14d-49df-bf59-e21551b43c86/marilyn_knit_texture_1781361628992.png" "$ASSETS_DIR/marilyn_knit_texture.png"
cp "/home/samiransamanta/.gemini/antigravity/brain/34937187-b14d-49df-bf59-e21551b43c86/marilyn_stacked_sweaters_1781361589047.png" "$ASSETS_DIR/marilyn_stacked_sweaters.png"
cp "/home/samiransamanta/.gemini/antigravity/brain/34937187-b14d-49df-bf59-e21551b43c86/marilyn_woman_knitting_1781361609587.png" "$ASSETS_DIR/marilyn_woman_knitting.png"
cp "/home/samiransamanta/.gemini/antigravity/brain/34937187-b14d-49df-bf59-e21551b43c86/crochet_creation_logo_1781361849517.png" "$ASSETS_DIR/crochet_creation_logo.png"

echo "Image assets copy complete! Please check git status and commit."
