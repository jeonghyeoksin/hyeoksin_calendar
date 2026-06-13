import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');
lines.splice(75, 1, "      '개발자 정혁신 상시 피드백 내용 제거 및 실무 집중력 강화'", "    ]", "  },", "  {");
fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Fixed file');
