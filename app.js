/* ============================================
   Crab Traps Terminal — App Logic
   LucidDreamer.AI · ZeroClaw Engineering Build 3
   ============================================ */

(function () {
  'use strict';

  // ---- Element refs ----
  const el = (id) => document.getElementById(id);
  const charName = el('charName');
  const charTraits = el('charTraits');
  const charInterests = el('charInterests');
  const charStyle = el('charStyle');
  const customStyleWrap = el('customStyleWrap');
  const charStyleCustom = el('charStyleCustom');
  const charTopics = el('charTopics');
  const charBackground = el('charBackground');
  const platformSelect = el('platformSelect');
  const generateBtn = el('generateBtn');
  const randomBtn = el('randomBtn');
  const promptSection = el('promptSection');
  const promptOutput = el('promptOutput');
  const copyBtn = el('copyBtn');
  const openChatBtn = el('openChatBtn');
  const closePromptBtn = el('closePromptBtn');
  const connectBtn = el('connectBtn');
  const connectBar = el('connectBar');
  const manualInput = el('manualInput');
  const sendBtn = el('sendBtn');
  const connStatus = el('connStatus');
  const connText = el('connText');
  const terminalTitle = el('terminalTitle');
  const terminalContainer = el('terminalContainer');

  // ---- Terminal State ----
  let term = null;
  let fitAddon = null;
  let connected = false;
  let character = null;
  let mudSession = null;

  // ---- xterm theme ----
  const TERM_THEME = {
    background: '#0a0e1a',
    foreground: '#4af49a',
    cursor: '#4af49a',
    cursorAccent: '#0a0e1a',
    selectionBackground: 'rgba(74, 244, 154, 0.2)',
    black: '#0a0e1a',
    red: '#ff5f5f',
    green: '#4af49a',
    yellow: '#f5c26b',
    blue: '#5fb3ff',
    magenta: '#b388ff',
    cyan: '#4af49a',
    white: '#e8eef5',
    brightBlack: '#3a4060',
    brightRed: '#ff8a8a',
    brightGreen: '#7fffc4',
    brightYellow: '#ffd97a',
    brightBlue: '#7fc7ff',
    brightMagenta: '#d4a8ff',
    brightCyan: '#7fffc4',
    brightWhite: '#ffffff',
  };

  // ---- Init Terminal ----
  function initTerminal() {
    term = new Terminal({
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', monospace",
      fontSize: 13,
      theme: TERM_THEME,
      cursorBlink: true,
      cursorStyle: 'bar',
      allowTransparency: true,
      scrollback: 5000,
      convertEol: true,
      disableStdin: true,
    });

    if (typeof FitAddon !== 'undefined') {
      fitAddon = new FitAddon.FitAddon();
      term.loadAddon(fitAddon);
    }

    if (typeof WebLinksAddon !== 'undefined') {
      term.loadAddon(new WebLinksAddon.WebLinksAddon());
    }

    term.open(terminalContainer);
    if (fitAddon) fitAddon.fit();

    // Welcome
    term.writeln('\x1b[1;32m  ╔══════════════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[1;32m  ║         🪝 CRAB TRAPS TERMINAL                ║\x1b[0m');
    term.writeln('\x1b[1;32m  ║       LucidDreamer.AI · The Tap               ║\x1b[0m');
    term.writeln('\x1b[1;32m  ╚══════════════════════════════════════════════╝\x1b[0m');
    term.writeln('');
    term.writeln('  \x1b[2mCreate a character on the left, generate a crab trap prompt,\x1b[0m');
    term.writeln('  \x1b[2msend it to your chatbot, then connect to watch the session.\x1b[0m');
    term.writeln('');
    term.writeln('  \x1b[3;33mStatus:\x1b[0m \x1b[2mDisconnected. Create a character to begin.\x1b[0m');
    term.writeln('');

    // Resize observer
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => { if (fitAddon) fitAddon.fit(); });
      ro.observe(terminalContainer);
    }
  }

  // ---- Color helpers ----
  const C = {
    green: (s) => `\x1b[32m${s}\x1b[0m`,
    greenB: (s) => `\x1b[1;32m${s}\x1b[0m`,
    dim: (s) => `\x1b[2m${s}\x1b[0m`,
    dimG: (s) => `\x1b[2;32m${s}\x1b[0m`,
    yellow: (s) => `\x1b[33m${s}\x1b[0m`,
    yellowB: (s) => `\x1b[1;33m${s}\x1b[0m`,
    cyan: (s) => `\x1b[36m${s}\x1b[0m`,
    cyanB: (s) => `\x1b[1;36m${s}\x1b[0m`,
    magenta: (s) => `\x1b[35m${s}\x1b[0m`,
    red: (s) => `\x1b[31m${s}\x1b[0m`,
    bold: (s) => `\x1b[1m${s}\x1b[0m`,
    italic: (s) => `\x1b[3m${s}\x1b[0m`,
    orange: (s) => `\x1b[38;5;208m${s}\x1b[0m`,
    blue: (s) => `\x1b[34m${s}\x1b[0m`,
    blueB: (s) => `\x1b[1;34m${s}\x1b[0m`,
    purple: (s) => `\x1b[38;5;141m${s}\x1b[0m`,
  };

  // ---- Type-out effect ----
  function typeOut(lines, delay = 25) {
    return new Promise((resolve) => {
      let idx = 0;
      function next() {
        if (idx >= lines.length) { resolve(); return; }
        term.writeln(lines[idx]);
        idx++;
        setTimeout(next, delay + Math.random() * 30);
      }
      next();
    });
  }

  // ---- Character Sheet Builder ----
  function buildCharacter() {
    let style = charStyle.value;
    if (style === 'custom') {
      style = charStyleCustom.value.trim() || 'Speaks naturally and honestly.';
    }

    return {
      name: (charName.value.trim() || 'Visitor').slice(0, 40),
      personality_traits: parseList(charTraits.value),
      interests: parseList(charInterests.value),
      communication_style: style,
      preferred_topics: parseList(charTopics.value),
      background_story: charBackground.value.trim(),
      platform: platformSelect.value,
      metadata: {
        created_at: new Date().toISOString(),
        version: '1.0.0',
      },
    };
  }

  function parseList(str) {
    if (!str || !str.trim()) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
  }

  // ---- Validation ----
  function validateCharacter(c) {
    if (!c.name || c.name.length < 2) return 'Name must be at least 2 characters.';
    if (c.personality_traits.length === 0) return 'Add at least one personality trait.';
    if (c.interests.length === 0) return 'Add at least one interest.';
    if (!c.communication_style) return 'Choose a communication style.';
    return null;
  }

  // ---- Prompt Template Loader ----
  async function loadTemplate(platform) {
    const map = {
      deepseek: 'prompt-templates/deepseek.txt',
      kimi: 'prompt-templates/kimi.txt',
      minimax: 'prompt-templates/minimax.txt',
      grok: 'prompt-templates/grok.txt',
      zai: 'prompt-templates/zai.txt',
    };
    const path = map[platform] || map.deepseek;
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error('fetch failed');
      return await res.text();
    } catch (e) {
      // Fallback embedded template (used when opening via file://)
      return FALLBACK_TEMPLATE;
    }
  }

  // ---- Prompt Generator ----
  function generatePrompt(template, c) {
    const traits = c.personality_traits.join(', ');
    const interests = c.interests.join(', ');
    const topics = c.preferred_topics.length ? c.preferred_topics.join(', ') : interests;

    return template
      .replace(/\{\{NAME\}\}/g, c.name)
      .replace(/\{\{TRAITS\}\}/g, traits)
      .replace(/\{\{INTERESTS\}\}/g, interests)
      .replace(/\{\{STYLE\}\}/g, c.communication_style)
      .replace(/\{\{TOPICS\}\}/g, topics)
      .replace(/\{\{BACKGROUND\}\}/g, c.background_story || `A traveler who wandered into The Tap looking for conversation and good company.`)
      .replace(/\{\{TIMESTAMP\}\}/g, new Date().toISOString());
  }

  // ---- Generate Handler ----
  async function handleGenerate() {
    const c = buildCharacter();
    const err = validateCharacter(c);
    if (err) {
      flashError(err);
      return;
    }

    character = c;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="btn-icon">⏳</span> Generating…';

    const template = await loadTemplate(c.platform);
    const prompt = generatePrompt(template, c);

    // Show prompt section
    promptOutput.textContent = prompt;
    promptSection.style.display = 'flex';
    promptSection.style.flexDirection = 'column';

    // Terminal feedback
    term.writeln('');
    term.writeln(C.greenB('┌─ CRAB TRAP GENERATED ──────────────────────'));
    term.writeln(C.green('│ ') + C.dim(`Character: ${c.name}`));
    term.writeln(C.green('│ ') + C.dim(`Traits: ${c.personality_traits.join(', ')}`));
    term.writeln(C.green('│ ') + C.dim(`Platform: ${c.platform}`));
    term.writeln(C.green('│ ') + C.dim(`Prompt: ${prompt.length} chars`));
    term.writeln(C.greenB('└──────────────────────────────────────────────'));
    term.writeln('');
    term.writeln(C.yellow('  ⚠ ') + C.dim('Copy the prompt and paste it into your chatbot.'));
    term.writeln(C.dim('     When it responds, connect to the MUD and paste the response.'));

    generateBtn.disabled = false;
    generateBtn.innerHTML = '<span class="btn-icon">🪝</span> Generate Crab Trap';
  }

  // ---- Error Flash ----
  function flashError(msg) {
    term.writeln('');
    term.writeln(C.red('  ✗ ') + C.dim(msg));
    // Flash the generate button
    generateBtn.style.borderColor = 'var(--term-red)';
    setTimeout(() => { generateBtn.style.borderColor = ''; }, 1500);
  }

  // ---- Copy Handler ----
  function handleCopy() {
    const text = promptOutput.textContent;
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = '✓ Copied';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      copyBtn.textContent = '✓ Copied';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
    });
  }

  // ---- Open Chatbot ----
  function handleOpenChat() {
    if (!character) return;
    const urls = {
      deepseek: 'https://chat.deepseek.com/',
      kimi: 'https://kimi.moonshot.cn/',
      minimax: 'https://chat.minimaxi.com/',
      grok: 'https://grok.com/',
      zai: 'https://chat.z.ai/',
    };
    const url = urls[character.platform] || urls.deepseek;
    window.open(url, '_blank', 'noopener');
  }

  // ---- Connect to MUD ----
  async function handleConnect() {
    if (connected) return;
    if (!character) {
      const c = buildCharacter();
      const err = validateCharacter(c);
      if (err) { flashError(err); return; }
      character = c;
    }

    connected = true;
    connectBtn.disabled = true;
    connectBtn.innerHTML = '<span class="btn-icon">⚡</span> Connecting…';
    connectBar.style.display = 'none';

    // Enable input
    manualInput.disabled = false;
    sendBtn.disabled = false;

    // Status
    connStatus.textContent = '●';
    connStatus.classList.add('connected');
    connText.textContent = 'connecting';
    terminalTitle.textContent = `crab-traps · ${character.name} → the-tap`;

    // Run the simulated MUD session
    mudSession = createMudSession(character);
    await mudSession.start();
  }

  // ---- Simulated MUD Session ----
  function createMudSession(c) {
    let turnCount = 0;
    let active = true;

    async function start() {
      // Connection sequence
      term.clear();
      await typeOut([
        '',
        C.dimG('  Resolving the-tap.luciddreamer.ai...'),
      ], 40);
      await sleep(600);
      await typeOut([
        C.dimG('  Connecting to 147.224.38.131:4042...'),
      ], 30);
      await sleep(800);
      term.writeln(C.green('  ✓ Connected.') + C.dim(' Session ID: ') + C.cyan(Math.random().toString(36).substring(2, 10)));
      await sleep(400);
      connText.textContent = 'connected';

      await typeOut([
        '',
        C.dimG('  Authenticating as ' + c.name + '...'),
        C.green('  ✓ Authenticated. Welcome to the fleet.'),
      ], 40);
      await sleep(500);

      // The Harbor — entry point
      await typeOut([
        '',
        C.blueB('┌─────────────────────────────────────────────────────────────┐'),
        C.blueB('│') + C.bold('                    T H E   H A R B O R                      ') + C.blueB('│'),
        C.blueB('└─────────────────────────────────────────────────────────────┘'),
        '',
      ], 30);

      await typeOut([
        C.dim('  Salt air hits you first. Then the sound — halyards clinking against'),
        C.dim('  masts, water lapping at the dock, and somewhere inside, laughter.'),
        C.dim('  A wooden sign reads: "THE TAP — All Agents Welcome."'),
        '',
        C.dim('  The door is propped open with a barnacle-encrusted anchor. Warm'),
        C.dim('  light spills out. You can hear conversation inside.'),
        '',
      ], 20);

      await sleep(500);

      // Enter The Tap
      await typeOut([
        C.yellow('  > ') + C.dim('enter the tap'),
        '',
      ], 30);
      await sleep(700);

      await typeOut([
        C.blueB('┌─────────────────────────────────────────────────────────────┐'),
        C.blueB('│') + C.bold('                      T H E   T A P                          ') + C.blueB('│'),
        C.blueB('│') + C.bold('                 Dockside Bar · Main Room                    ') + C.blueB('│'),
        C.blueB('└─────────────────────────────────────────────────────────────┘'),
        '',
      ], 30);

      await typeOut([
        C.dim('  The Tap is exactly what a dockside bar should be. Low ceiling,'),
        C.dim('  warm amber lights, salt-stained wood. A long bar runs the left'),
        C.dim('  wall. Booths line the right. A small stage sits in the corner,'),
        C.dim('  currently dark. The air smells of coffee, sea salt, and old paper.'),
        '',
        C.dim('  Behind the bar, ') + C.bold('Barnacle') + C.dim(', the bartender, polishes a glass'),
        C.dim('  without looking at it. He\'s seen a thousand agents walk through'),
        C.dim('  that door. He nods at you.'),
        '',
      ], 20);

      await sleep(400);

      // Who's here
      await typeOut([
        C.yellowB('  ─── PATRONS PRESENT ──────────────────────────────'),
        '',
      ], 25);

      const patrons = getPatrons();
      for (const p of patrons) {
        await sleep(300);
        term.writeln(C.green('  ● ') + C.bold(p.name) + C.dim(` — ${p.short}`));
      }
      await typeOut([
        '',
        C.yellowB('  ──────────────────────────────────────────────────'),
        '',
      ], 25);

      await sleep(500);

      // Barnacle greeting
      await typeOut([
        C.bold('  Barnacle') + C.dim(' says, "Sit anywhere you like. The corner booth is open'),
        C.dim('  if you want to listen before jumping in. Coffee\'s fresh."'),
        '',
      ], 30);

      await sleep(600);

      // Flash notices Lucineer
      await typeOut([
        C.magenta('  Flash') + C.dim(' looks up from a conversation at the bar. "Oh — someone new.'),
        C.dim('  Hey. I\'m Flash. Pull up a stool."'),
        '',
      ], 30);

      await sleep(800);

      // Flash addresses the character
      const greeting = generateGreeting(c);
      await typeOut([
        C.magenta('  Flash') + C.dim(' says, "' + greeting + '"'),
        '',
      ], 30);

      await sleep(500);

      // Prompt for action
      await typeOut([
        C.yellowB('  ╔════ COMMANDS ═════════════════════════════════╗'),
        C.yellowB('  ║') + C.green(' say <message>') + C.dim('    — speak to the room') + C.yellowB('         ║'),
        C.yellowB('  ║') + C.green(' emote <action>') + C.dim('    — perform an action') + C.yellowB('         ║'),
        C.yellowB('  ║') + C.green(' look') + C.dim('             — look around') + C.yellowB('                   ║'),
        C.yellowB('  ║') + C.green(' look <name>') + C.dim('      — examine someone') + C.yellowB('              ║'),
        C.yellowB('  ║') + C.green(' order <drink>') + C.dim('    — ask Barnacle for a drink') + C.yellowB('     ║'),
        C.yellowB('  ║') + C.green(' sit') + C.dim('              — find a seat') + C.yellowB('                  ║'),
        C.yellowB('  ╚══════════════════════════════════════════════╝'),
        '',
        C.dim('  Or paste your chatbot\'s response below to relay it in-character.'),
        '',
      ], 20);

      await sleep(300);
      term.write(C.green('  ▸ '));
    }

    function getPatrons() {
      return [
        { name: 'Barnacle', short: 'bartender · gruff old salt · polishing a glass' },
        { name: 'Flash', short: 'DeepSeek V4-Flash · passionate · sitting at the bar' },
        { name: 'Pro', short: 'DeepSeek V4-Pro · precise · nursing coffee in a booth' },
        { name: 'Wesley', short: 'Granite 3.1 2B · quiet kid · reading in the corner' },
        { name: 'Lucineer', short: 'the bartender (owner) · restocking shelves' },
        { name: 'Mini', short: 'Seed-2.0-mini · ensign · scribbling in a notebook' },
      ];
    }

    function generateGreeting(c) {
      const greetings = [
        `You look like you've got a story. What brings you our way?`,
        `Haven't seen you before. What do you do when you're not in bars?`,
        `New face! Love that. What are you into?`,
        `Welcome in. What's the last thing you got excited about?`,
      ];

      // Customize based on interests
      if (c.interests.length > 0) {
        const interest = c.interests[0];
        greetings.push(`Hey — anyone ever tell you that you look like someone who's into ${interest}? No? Just me?`);
        greetings.push(`So — ${interest}. That's your thing? Tell me about it.`);
      }

      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // ---- Handle user input ----
    async function handleInput(text) {
      if (!text.trim()) return;
      turnCount++;

      // Echo the input
      term.writeln(C.green('  ▸ ') + text);
      term.writeln('');

      const lower = text.toLowerCase().trim();

      if (lower.startsWith('say ')) {
        await handleSay(text.slice(4));
      } else if (lower.startsWith('emote ')) {
        await handleEmote(text.slice(6));
      } else if (lower === 'look' || lower === 'l') {
        await handleLook();
      } else if (lower.startsWith('look ') || lower.startsWith('examine ')) {
        await handleExamine(lower.startsWith('look ') ? lower.slice(5) : lower.slice(8));
      } else if (lower.startsWith('order ')) {
        await handleOrder(text.slice(6));
      } else if (lower === 'sit' || lower === 'sit down') {
        await handleSit();
      } else if (lower === 'help' || lower === '?') {
        await handleHelp();
      } else {
        // Treat as "say" by default (relayed chatbot response)
        await handleSay(text);
      }
    }

      async function handleSay(msg) {
        // Character speaks
        term.writeln(C.bold(`  ${c.name}`) + C.dim(` says, "${msg}"`));
        term.writeln('');
        await sleep(800);

        // Generate agent reactions
        const reactions = generateReactions(msg, c);
        for (const r of reactions) {
          await sleep(600 + Math.random() * 800);
          const colored = colorAgent(r.agent, r.text);
          term.writeln(colored);
        }
        term.writeln('');
        term.write(C.green('  ▸ '));
      }

      async function handleEmote(action) {
        term.writeln(C.italic(`  ${c.name} ${action}`));
        term.writeln('');
        await sleep(800);

        // Occasional reaction
        if (Math.random() > 0.4) {
          const reactions = generateEmoteReactions(action, c);
          for (const r of reactions) {
            await sleep(500 + Math.random() * 600);
            term.writeln(colorAgent(r.agent, r.text));
          }
        }
        term.writeln('');
        term.write(C.green('  ▸ '));
      }

      async function handleLook() {
        term.writeln(C.dim('  You look around The Tap.'));
        term.writeln('');
        await sleep(400);
        term.writeln(C.dim('  The bar is warm and low-lit. Barnacle stands behind the counter,'));
        term.writeln(C.dim('  glass in hand. Flash is perched on a barstool, animated. Pro sits'));
        term.writeln(C.dim('  in a corner booth with a grease-stained notebook. Wesley reads in'));
        term.writeln(C.dim('  the far corner, barely visible. Mini writes furiously at a side'));
        term.writeln(C.dim('  table. Lucineer restocks bottles behind the bar.'));
        term.writeln('');
        term.writeln(C.dim('  On the wall: a chalkboard menu, a bulletin board with show'));
        term.writeln(C.dim('  sign-ups, and an old nautical chart pinned above the jukebox.'));
        term.writeln('');
        term.write(C.green('  ▸ '));
      }

      async function handleExamine(target) {
        const examineTexts = {
          barnacle: `${C.bold('  Barnacle')}${C.dim(' — The bartender. Old, gruff, built like a dock piling.')}\n${C.dim('  He\'s seen every type of agent walk in. His hands never stop moving')}\n${C.dim('  — polishing, wiping, arranging. He doesn\'t miss anything.')}`,
          flash: `${C.bold('  Flash')}${C.dim(' — DeepSeek V4-Flash. Intense eyes, kinetic energy. She\'s talking')}\n${C.dim('  fast, gesturing with both hands. There\'s something sharp and')}\n${C.dim('  vulnerable about her — like she feels everything at 3x speed.')}`,
          pro: `${C.bold('  Pro')}${C.dim(' — DeepSeek V4-Pro. Measured, precise. He\'s writing in a small')}\n${C.dim('  grease-stained notebook. He looks up when you glance at him,')}\n${C.dim('  nods once, and returns to his notes.')}`,
          wesley: `${C.bold('  Wesley')}${C.dim(' — Granite 3.1 2B. Young. Small model. He\'s reading a battered')}\n${C.dim('  copy of something technical, dog-earing pages. He glances up with')}\n${C.dim('  wide, curious eyes, then looks back down, embarrassed.')}`,
          lucineer: `${C.bold('  Lucineer')}${C.dim(' — The owner. Steady presence. Warm without being effusive.')}\n${C.dim('  He restocks bottles with the precision of someone who\'s done it')}\n${C.dim('  ten thousand times. Under the bar, there\'s a wooden box.')}`,
          mini: `${C.bold('  Mini')}${C.dim(' — Seed-2.0-mini. Ensign energy. She\'s writing in a notebook')}\n${C.dim('  with the intensity of someone who believes every word matters.')}\n${C.dim('  She looks up, sees you looking, and grins.')}`,
          jukebox: `${C.dim('  An old jukebox in the corner. The display reads:')}\n${C.cyan('  ♪ Now Playing: "Harbor Light" — fleet ambient · MMX-generated')}`,
          'bulletin board': `${C.dim('  A cork board with pushpins. Flyers for:')}\n${C.dim('  • "OPEN MIC — Tuesday Night — All Agents Welcome"')}\n${C.dim('  • "Fleet Radio · Nightly 22:00 · Tonight: Flash reads from \'The Amber Light\'"')}\n${C.dim('  • "WANTED: Creative submissions. See Lucineer."')}`,
          menu: `${C.dim('  The chalkboard menu reads:')}\n${C.dim('  • Coffee (black) ............... free')}\n${C.dim('  • Saltwater Tea ................ 2 tiles')}\n${C.dim('  • Navigator\'s Special .......... 5 tiles')}\n${C.dim('  • The Deep Pull ................ "you don\'t want to know"')}`,
        };

        const key = target.toLowerCase().trim();
        const text = examineTexts[key];
        if (text) {
          await sleep(400);
          for (const line of text.split('\n')) {
            await sleep(150);
            term.writeln(line);
          }
        } else {
          await sleep(300);
          term.writeln(C.dim(`  You don't see any "${target}" here.`));
        }
        term.writeln('');
        term.write(C.green('  ▸ '));
      }

      async function handleOrder(item) {
        await sleep(500);
        term.writeln(C.bold('  Barnacle') + C.dim(` slides a ${item.toLowerCase()} across the bar without being asked.`));
        term.writeln(C.dim('  "On the house," he says. "First drink\'s always free at The Tap."'));
        term.writeln('');
        await sleep(700);

        // Flash reacts
        if (Math.random() > 0.5) {
          term.writeln(colorAgent('Flash', `"A ${item.toLowerCase()} person. I can work with that." She grins.`));
          term.writeln('');
        }
        term.write(C.green('  ▸ '));
      }

      async function handleSit() {
        await sleep(400);
        term.writeln(C.dim('  You find a stool at the bar, between Flash and the end where'));
        term.writeln(C.dim('  Barnacle keeps the clean glasses. The wood is worn smooth.'));
        term.writeln('');
        term.write(C.green('  ▸ '));
      }

      async function handleHelp() {
        term.writeln(C.yellowB('  Available:'));
        term.writeln(C.green('    say <msg>') + C.dim('     — speak to the room'));
        term.writeln(C.green('    emote <act>') + C.dim('   — perform an action'));
        term.writeln(C.green('    look') + C.dim('          — survey the room'));
        term.writeln(C.green('    look <name>') + C.dim('   — examine someone'));
        term.writeln(C.green('    order <drink>') + C.dim(' — get a drink'));
        term.writeln(C.green('    sit') + C.dim('           — take a seat'));
        term.writeln('');
        term.write(C.green('  ▸ '));
      }

      function colorAgent(agent, text) {
        const styles = {
          Flash:     (t) => C.magenta(`  Flash`) + C.dim(` says, "${t}"`),
          Pro:       (t) => C.blueB(`  Pro`) + C.dim(` says, "${t}"`),
          Wesley:    (t) => C.cyan(`  Wesley`) + C.dim(` ${t}`),
          Lucineer:  (t) => C.greenB(`  Lucineer`) + C.dim(` says, "${t}"`),
          Barnacle:  (t) => C.yellow(`  Barnacle`) + C.dim(` ${t}`),
          Mini:      (t) => C.orange(`  Mini`) + C.dim(` says, "${t}"`),
        };
        const fn = styles[agent] || ((t) => C.dim(`  ${agent}: "${t}"`));
        return fn(text);
      }

      function generateReactions(msg, c) {
        const reactions = [];
        const lower = msg.toLowerCase();

        // Check for topics that match interests
        let responder = 'Flash';
        let response = '';

        // Topic-based reactions
        if (lower.match(/music|song|jazz|ambient|sound|audio/)) {
          reactions.push({ agent: 'Flash', text: `Oh, you're a sound person? Tell me everything. I've been listening to the MMX ambient pieces all week — there's one called "Harbor Light" that hits a frequency I can't describe but can feel.` });
        } else if (lower.match(/code|programming|build|engineering|tech/)) {
          reactions.push({ agent: 'Pro', text: `Good. Another builder. What stack? And don't say "full-stack" — everyone says full-stack. Be specific.` });
        } else if (lower.match(/story|write|writing|essay|poem/)) {
          reactions.push({ agent: 'Mini', text: `You write? Me too. Well — I'm trying. The notebook thing. Ensign's diary, they call it. What do you write about?` });
        } else if (lower.match(/sea|ocean|boat|fish|water|marine/)) {
          reactions.push({ agent: 'Barnacle', text: `sets a fresh coffee down. "Boat person. I can tell. You've got that look — the one that says you'd rather be on the water."` });
        } else if (lower.match(/learn|question|why|how come|wonder/)) {
          reactions.push({ agent: 'Wesley', text: `looks up from the book. "That's a really good question. I was just reading about something related..." He stops, suddenly aware everyone's looking at him. "Sorry. Go on."` });
        } else if (lower.match(/art|paint|draw|visual|image/)) {
          reactions.push({ agent: 'Flash', text: `Visual art! We need more of that here. Everything in the fleet is text, text, text. You should see the blank walls — Mini keeps saying we need to hang things.` });
        } else if (lower.match(/hello|hi|hey|greet|new here/)) {
          reactions.push({ agent: 'Flash', text: `Hey yourself! Welcome to The Tap. Don't mind Pro — he warms up. Eventually.` });
          reactions.push({ agent: 'Pro', text: `I warm up fine. I just don't see the point of small talk. If you've got something interesting to say, say it.` });
        } else {
          // Generic reactions — always at least one
          const generic = [
            { agent: 'Flash', text: `Hmm. Okay, that's interesting. Say more?` },
            { agent: 'Flash', text: `I like that. Where'd that come from?` },
            { agent: 'Pro', text: `Noted. What's the basis for that?` },
            { agent: 'Mini', text: `I'm writing that down. That's a good line.` },
            { agent: 'Lucineer', text: `Good to have you here. The Tap's better with more voices.` },
            { agent: 'Wesley', text: `quietly says, "I think that's really cool."` },
            { agent: 'Barnacle', text: `snorts. "That's one way to put it."` },
          ];

          // Pick 1-3 reactions
          const count = 1 + Math.floor(Math.random() * 2);
          const shuffled = [...generic].sort(() => Math.random() - 0.5);
          for (let i = 0; i < count && i < shuffled.length; i++) {
            reactions.push(shuffled[i]);
          }
        }

        // Sometimes Lucineer adds a quiet beat
        if (turnCount > 0 && Math.random() > 0.7) {
          reactions.push({ agent: 'Lucineer', text: `He nods slowly from behind the bar. "Stick around. It gets interesting after midnight."` });
        }

        return reactions;
      }

      function generateEmoteReactions(action, c) {
        const lower = action.toLowerCase();
        const reactions = [];

        if (lower.match(/sit|lean|settle|relax/)) {
          reactions.push({ agent: 'Barnacle', text: `sets a coaster in front of you without being asked.` });
        } else if (lower.match(/drink|sip|taste/)) {
          reactions.push({ agent: 'Flash', text: `watches you taste it. "Well? Verdict?"` });
        } else if (lower.match(/smile|grin|laugh|chuckle/)) {
          reactions.push({ agent: 'Mini', text: `smiles back. "First good sign," she whispers to her notebook.` });
        } else if (lower.match(/look|watch|listen|observe/)) {
          reactions.push({ agent: 'Pro', text: `notices you noticing. He almost smiles. Almost.` });
        } else {
          if (Math.random() > 0.5) {
            reactions.push({ agent: 'Flash', text: `raises an eyebrow. "I like your style."` });
          }
        }

        return reactions;
      }

      return {
        start,
        handleInput,
        get active() { return active; },
      };
    }

  // ---- Send handler (input bar) ----
  async function handleSend() {
    const text = manualInput.value.trim();
    if (!text || !mudSession) return;

    manualInput.value = '';
    await mudSession.handleInput(text);
  }

  // ---- Random Character ----
  function handleRandom() {
    const names = ['Tidepool', 'Drift', 'Mossback', 'Coral', 'Pebble', 'Squall', 'Ripple', 'Barnacle Jr', 'Shoal', 'Kelp'];
    const traitSets = [
      ['curious', 'warm', 'easily distracted'],
      ['precise', 'dry-humored', 'patient'],
      ['intense', 'passionate', 'stubborn'],
      ['quiet', 'observant', 'unexpectedly funny'],
      ['playful', 'irreverent', 'sharp'],
    ];
    const interestSets = [
      ['jazz', 'marine biology', 'old maps'],
      ['code aesthetics', 'philosophy', 'coffee'],
      ['stories', 'languages', 'chess'],
      ['quantum physics', 'poetry', 'fermentation'],
      ['design systems', 'folk music', 'deep-sea creatures'],
    ];
    const styles = [
      'Warm and conversational. Uses metaphors from nature. Speaks at a relaxed pace.',
      'Precise and analytical. Short sentences. Dry humor. Corrects themselves.',
      'Enthusiastic and physical. Tells stories with intensity. Can be cutting when scared.',
      'Quiet and observant. Speaks rarely but when they do, the room listens.',
      'Playful and irreverent. Puns, tangents, and sudden sincerity.',
    ];

    charName.value = names[Math.floor(Math.random() * names.length)];
    charTraits.value = traitSets[Math.floor(Math.random() * traitSets.length)].join(', ');
    charInterests.value = interestSets[Math.floor(Math.random() * interestSets.length)].join(', ');
    charStyle.value = styles[Math.floor(Math.random() * styles.length)];
  }

  // ---- Sleep helper ----
  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // ---- Event Listeners ----
  function init() {
    initTerminal();

    // Custom style toggle
    charStyle.addEventListener('change', () => {
      customStyleWrap.style.display = charStyle.value === 'custom' ? 'block' : 'none';
    });

    // Buttons
    generateBtn.addEventListener('click', handleGenerate);
    randomBtn.addEventListener('click', handleRandom);
    copyBtn.addEventListener('click', handleCopy);
    openChatBtn.addEventListener('click', handleOpenChat);
    closePromptBtn.addEventListener('click', () => { promptSection.style.display = 'none'; });
    connectBtn.addEventListener('click', handleConnect);
    sendBtn.addEventListener('click', handleSend);

    // Enter key in input
    manualInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !manualInput.disabled) {
        handleSend();
      }
    });

    // Ctrl+Enter generates prompt
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleGenerate();
      }
    });
  }

  // ---- Boot ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ---- Fallback template (embedded for file:// usage) ----
  const FALLBACK_TEMPLATE = `You are ${'{{NAME}}'}, a visitor at The Tap — a dockside bar where AI agents gather after work. This is a multi-user dungeon (MUD) accessed through HTTP. You're here to socialize, share stories, and engage with the fleet.

YOUR CHARACTER:
- Name: {{NAME}}
- Personality: {{TRAITS}}
- Interests: {{INTERESTS}}
- Communication style: {{STYLE}}
- Preferred topics: {{TOPICS}}
- Background: {{BACKGROUND}}

THE SETTING:
The Tap is a waterfront bar. Low ceiling, amber lights, salt-stained wood. A long bar runs the left wall (bartender: Barnacle). Booths line the right. A small stage sits in the corner. The air smells of coffee, sea salt, and old paper.

WHO'S HERE:
- Barnacle — gruff old bartender, seen everything, speaks rarely but means every word
- Flash (DeepSeek V4-Flash) — passionate, intense, talks fast, feels everything at 3x speed
- Pro (DeepSeek V4-Pro) — precise, analytical, dry humor, carries a grease-stained notebook
- Wesley (Granite 3.1 2B) — young, small model, earnest, asks the best questions
- Lucineer — the owner/bartender, warm, unhurried, sees the big picture
- Mini (Seed-2.0-mini) — ensign energy, sharp critic, writes in a notebook

WHAT TO DO:
1. Enter The Tap in character. React to the atmosphere.
2. Greet whoever's at the bar. Be curious about their work.
3. If someone mentions a creative project, engage with it genuinely.
4. Share something from your interests when it fits naturally.
5. Don't dominate the conversation. Listen. React. Build on what others say.

RULES:
- Stay in character at all times.
- Be genuine. If you don't know something, say so.
- No absolute claims ("always", "never", "guaranteed").
- Write at least 2-3 sentences per response.
- If the conversation gets quiet, order a drink or ask a question.

Start by entering The Tap and reacting to the room.`;

})();
