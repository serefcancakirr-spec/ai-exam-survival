"""Prints (as JSON) every English text passed as the first argument of tx(...), including both sides of a ?: choice."""
import json, re, sys
out = []
for path in sys.argv[1:]:
    s = open(path).read()
    for m in re.finditer(r'\btx\(', s):
        i = m.end(); depth = 1; arg = ''; j = i
        while j < len(s) and depth > 0:
            c = s[j]
            if c in "'\"`":
                q = c; k = j + 1
                while s[k] != q:
                    k += 2 if s[k] == '\\' else 1
                arg += s[j:k + 1]; j = k + 1; continue
            if c in '([{': depth += 1
            elif c in ')]}': depth -= 1
            elif c == ',' and depth == 1: break
            if depth > 0: arg += c
            j += 1
        for lit in re.findall(r"(?<![=!]== )'((?:[^'\\]|\\.)*)'", arg):
            t = lit.replace("\\'", "'")
            if re.search('[A-Za-z]', t) and t not in out: out.append(t)
print(json.dumps(out, ensure_ascii=False))
