import json
import os

evals = [
    {
        "id": 1,
        "name": "checkout-button",
        "assertions": [
            { "name": "uses_theme_color", "logic": lambda text: "THEME_COLOR" in text, "desc": "Component uses THEME_COLOR instead of hardcoded hex colors." },
            { "name": "no_tailwind", "logic": lambda text: "className=" not in text, "desc": "Component does not use className or Tailwind classes." }
        ]
    },
    {
        "id": 2,
        "name": "category-scroller",
        "assertions": [
            { "name": "uses_usecallback", "logic": lambda text: "useCallback" in text, "desc": "Component uses useCallback for the renderItem function." },
            { "name": "flatlist_optimization", "logic": lambda text: "initialNumToRender" in text or "windowSize" in text, "desc": "FlatList uses initialNumToRender or windowSize for performance." }
        ]
    },
    {
        "id": 3,
        "name": "profile-header",
        "assertions": [
            { "name": "uses_theme_color", "logic": lambda text: "THEME_COLOR" in text, "desc": "Component uses THEME_COLOR for the Follow button." },
            { "name": "uses_stylesheet", "logic": lambda text: "StyleSheet.create" in text, "desc": "Component uses StyleSheet.create instead of inline styles for layout." }
        ]
    }
]

workspace = "iteration-1"
for eval_case in evals:
    for variant in ["with_skill", "without_skill"]:
        folder_path = f"{workspace}/eval-{eval_case['id']}/{variant}/outputs"
        
        # Read the generated output file
        text_content = ""
        if os.path.exists(folder_path):
            for file in os.listdir(folder_path):
                if file.endswith('.js'):
                    with open(os.path.join(folder_path, file), 'r', encoding='utf-8') as f:
                        text_content = f.read()

        grading_results = []
        for assertion in eval_case["assertions"]:
            passed = assertion["logic"](text_content)
            grading_results.append({
                "text": assertion["desc"],
                "passed": passed,
                "evidence": "Found in code syntax" if passed else "Missing from syntax"
            })
        
        grade_path = f"{workspace}/eval-{eval_case['id']}/{variant}/grading.json"
        
        # Ensure dir exists before trying to write grading.json
        os.makedirs(os.path.dirname(grade_path), exist_ok=True)
        
        with open(grade_path, 'w', encoding='utf-8') as f:
            json.dump({ "expectations": grading_results }, f, indent=2)

print("Grading complete.")
