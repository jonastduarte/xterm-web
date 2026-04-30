
function clean(str: string) {
  let res = str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
  res = res.replace(/[\u001b\u009b]\].*?(?:\u0007|\u001b\\\\)/g, '');
  return res;
}
const input = '\x1B[?2004h\x1B]0;jonas@ClaroConsole: ~\x07\x1B[01;32mjonas\x1B[00m:\x1B[01;34m~\x1B[00m$ ls -la\n\x1B[?2004l';
console.log(JSON.stringify(clean(input)));

