#!/usr/bin/env python3
import sys

with open('src/scripts/game-source.js', 'r') as f:
    lines = f.readlines()

# Fix 1: In resolveArrival, add `const own = ownGoal(state.possession);` after goal declaration
found1 = False
for i, line in enumerate(lines):
    stripped = line.strip()
    if stripped == 'const goal = goalFor(state.possession);' and not found1:
        if i + 3 < len(lines) and "if (ball.mode === 'shot')" in lines[i+3]:
            indent = '        '
            lines.insert(i + 1, indent + 'const own = ownGoal(state.possession);\n')
            found1 = True
            print(f'Fix 1: Added own goal var at line {i+2}')
            break

if not found1:
    print('ERROR: Fix 1 failed')
    sys.exit(1)

# Fix 2: Add own goal check in shot block, before the "A shot only ever answers" comment
found2 = False
for i, line in enumerate(lines):
    if 'A shot only ever answers ON the goal line' in line:
        indent = '            '
        insertion = [
            indent + "/* §0 — OWN GOAL LAW: a shot that finishes in the shooter's own net is\n",
            indent + "   scored for the opponent. Both goals are tested so the result is\n",
            indent + "   decided by the net the ball actually entered. */\n",
            indent + "if (targetEntersGoal(ball.target, own)) {\n",
            indent + "    ball.alive = false;\n",
            indent + "    return scoreGoal(scorerForEnteredGoal(own));\n",
            indent + "}\n",
        ]
        lines[i:i] = insertion
        found2 = True
        print(f'Fix 2: Added own goal check at line {i+1}')
        break

if not found2:
    print('ERROR: Fix 2 failed')
    sys.exit(1)

# Fix 3: Add own goal check in pass block, before targetEntersGoal(ball.target, passGoal)
found3 = False
for i, line in enumerate(lines):
    if 'targetEntersGoal(ball.target, passGoal)' in line and 'if (' in line:
        indent = '            '
        insertion = [
            indent + "/* §0 — OWN GOAL LAW: a pass into the opponent's own net is\n",
            indent + "   scored for the team that owns that net. */\n",
        ]
        lines[i:i] = insertion
        found3 = True
        print(f'Fix 3: Added own goal check in pass block at line {i+1}')
        break

if not found3:
    print('WARNING: Fix 3 - pass block not found')

with open('src/scripts/game-source.js', 'w') as f:
    f.writelines(lines)

print('All fixes applied')
