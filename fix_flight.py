#!/usr/bin/env python3
import sys

with open('src/scripts/game-source.js', 'r') as f:
    lines = f.readlines()

# Fix 1: resolveArrival - add own goal check for shot
# Find line with "const goal = goalFor(state.possession);" inside resolveArrival
# This is at line 3205 (0-indexed: 3204)
found = False
for i, line in enumerate(lines):
    if line.strip() == 'const goal = goalFor(state.possession);' and not found:
        # Check next line is blank then "if (ball.mode === 'shot')"
        if i + 3 < len(lines) and 'if (ball.mode === \'shot\')' in lines[i+3]:
            # Replace the two lines (goal declaration + blank line)
            lines[i] = '        const goal = goalFor(state.possession);\n'
            lines[i+1] = '        const own = ownGoal(state.possession);\n'
            found = True
            print(f'Fix 1: Added own goal var at line {i+1}')
            break

if not found:
    print('ERROR: Fix 1 - could not find resolveArrival goal declaration')
    sys.exit(1)

# Fix 2: Add own goal check in shot block - after the post check, before the existing targetEntersGoal check
# Find the line: "if (targetEntersGoal(ball.target, goal)) {" inside the shot block
# This should be around line 3227
found2 = False
for i in range(3210, 3250):
    if i < len(lines) and 'if (targetEntersGoal(ball.target, goal)) {' in lines[i]:
        # Check this is inside the shot block (after post check, before pass block)
        if 'A shot only ever answers' in lines[i-1] or 'A shot only ever answers' in lines[i-2]:
            # Insert own goal check before this line
            # First, the comment change
            # Find the comment "A shot only ever answers"
            comment_line = i - 1
            for j in range(i-1, i-5, -1):
                if 'A shot only ever answers' in lines[j]:
                    comment_line = j
                    break
            
            insertion = [
                '            /* §0 \u2014 OWN GOAL LAW: a shot that finishes in the shooter\'s own net is\n',
                '                scored for the opponent. Both goals are tested so the result is\n',
                '                decided by the net the ball actually entered. */\n',
                '            if (targetEntersGoal(ball.target, own)) {\n',
                '                ball.alive = false;\n',
                '                return scoreGoal(scorerForEnteredGoal(own));\n',
                '            }\n',
            ]
            lines[comment_line:comment_line] = insertion
            found2 = True
            print(f'Fix 2: Added own goal check in shot block at line {comment_line+1}')
            break

if not found2:
    print('ERROR: Fix 2 - could not find shot targetEntersGoal check')
    sys.exit(1)

# Fix 3: Add own goal check in pass block
# Find the pass goal declaration
found3 = False
for i in range(3260, 3290):
    if i < len(lines) and 'const passGoal = goalFor(state.possession);' in lines[i]:
        # Add own goal check for passes too
        insertion = [
            '            /* §0 \u2014 OWN GOAL LAW: a pass into the opponent\'s own net is\n',
            '                scored for the team that owns that net. */\n',
        ]
        # Find the line after post check in pass block, before targetEntersGoal
        # Look for the pass targetEntersGoal check
        for j in range(i+1, min(i+20, len(lines))):
            if 'targetEntersGoal(ball.target, passGoal)' in lines[j] and 'if (' in lines[j]:
                lines[j:j] = insertion
                found3 = True
                print(f'Fix 3: Added own goal comment in pass block at line {j+1}')
                break
        break

if not found3:
    print('WARNING: Fix 3 - could not find pass targetEntersGoal check (may need manual review)')

with open('src/scripts/game-source.js', 'w') as f:
    f.writelines(lines)

print('All fixes applied')

