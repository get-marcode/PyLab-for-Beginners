/* ==========================================================================
   meta-en.js — Übersetzte Themen-Köpfe (Titel, Untertitel, Szenario, Lead)
   und Szenen-Beschreibungen. Schlüssel = Themen-ID aus content.js.
   Was hier fehlt, erscheint automatisch auf Deutsch.
   ========================================================================== */

const META = {
  en: {
    groups: {
      start: 'Start',
      grundlagen: 'Basics',
      struktur: 'Data structures',
      algo: 'Algorithms',
      baum: 'Trees & graphs',
      oop: 'Object orientation',
    },
    topics: {
      1: { title: 'Dashboard & progress' },

      2: {
        title: 'Python basics', subtitle: 'Variables, data types, print', scenario: 'Checkout & customer profile',
        lead: 'You build the heart of a café till: prices, quantities and customer profiles end up in variables, Python does the maths and <code>print()</code> prints the receipt.',
        scenes: {
          speicher: { title: 'Till memory', blurb: 'Every line puts values into labelled memory slots. Click step by step through a receipt.' },
          typen: { title: 'Type lab', blurb: 'Pick a value and apply a conversion. Some conversions fail — and that is a good thing.' },
          bon: { title: 'Receipt printer', blurb: 'Change item, price and quantity — the f-string formats the receipt live.' },
        },
      },
      3: {
        title: 'Control flow', subtitle: 'if, for, while', scenario: 'Sensor data & login',
        lead: 'A factory hall reports temperatures, a terminal checks passwords. <code>if</code> decides, <code>for</code> walks through readings, <code>while</code> repeats until a condition flips.',
        scenes: {
          ampel: { title: 'Temperature traffic light', blurb: 'Drag the slider and watch which branch of if / elif / else matches first.' },
          schleife: { title: 'Reading scanner', blurb: 'A for loop walks over the sensor values. Watch the sum and the maximum grow.' },
          login: { title: 'Login gate', blurb: 'Three attempts, then the terminal locks. Try wrong and right passwords.' },
        },
      },
      4: {
        title: 'Functions & scope', subtitle: 'def, return, visibility', scenario: 'Discount & price calculator',
        lead: 'An online shop keeps calculating the same things: discounts, shipping, totals. A function packs that calculation into one name. Each function has its own <strong>scope</strong> — not every variable is visible everywhere.',
        scenes: {
          callstack: { title: 'Call stack', blurb: 'Every function call puts a frame on top of the stack, every return removes it. Click through a price calculation.' },
          scope: { title: 'Scope table', blurb: 'Choose where in the code you are and see which variables are visible there. Click a line to try the access.' },
        },
      },
      5: {
        title: 'List comprehensions', subtitle: 'Build lists in one line', scenario: 'Server log files & IP addresses',
        lead: 'A web server writes thousands of log lines. You only want the errors, only internal IPs or cleaned-up text. A <strong>list comprehension</strong> builds a new list from an old one — filtering and transforming in a single expression.',
        scenes: {
          pipeline: { title: 'Data pipeline', blurb: 'The elements of the source list flow through the filter. Whatever passes the condition lands in the target list. Pick a comprehension above.' },
        },
      },
      6: {
        title: 'Lists (arrays)', subtitle: 'Index, append, insert, pop', scenario: 'IoT temperature sensors',
        lead: 'Sensors send readings every second. A list keeps them in order in numbered memory slots. Appending at the end is cheap — inserting at the front shifts everything behind it.',
        scenes: {
          slots: { title: 'Memory slots', blurb: 'The list as a row of numbered slots. Try append, insert(0) and pop — and watch the shift counter.' },
        },
      },
      7: {
        title: 'Tuples', subtitle: 'Immutable value groups', scenario: 'GPS coordinates & colour constants',
        lead: 'A location or a colour must not change by accident. A <strong>tuple</strong> looks like a list but is <em>immutable</em>: Python blocks any attempt to write to it.',
        scenes: {
          immutable: { title: 'List vs. tuple', blurb: 'The same values stored twice. Run the same operation on both and see which one resists.' },
          unpack: { title: 'Unpacking', blurb: 'A tuple can be unpacked into variables — but the count has to match. Choose how many variables are on the left.' },
        },
      },
      8: {
        title: 'Stack (LIFO)', subtitle: 'Last in, first out', scenario: 'Undo history in a text editor',
        lead: 'Ctrl+Z always undoes the last action. That is exactly what a <strong>stack</strong> does: elements are put on top (push) and only taken from the top (pop). In Python a list with <code>append</code> and <code>pop()</code> is enough.',
        scenes: {
          teller: { title: 'Stack of plates', blurb: 'Plates only go on top and only leave from the top. Try pulling the bottom plate, too.' },
          undo: { title: 'Undo history', blurb: 'Every action goes onto the stack. Ctrl+Z takes the top one off again.' },
        },
      },
      9: {
        title: 'Queue (FIFO)', subtitle: 'First in, first out', scenario: 'IT support ticket system',
        lead: 'In support, first come, first served. New tickets join at the back, work happens at the front. A <strong>queue</strong> follows the FIFO principle — in Python with <code>append</code> (in at the back) and <code>pop(0)</code> (out at the front).',
        scenes: {
          schlange: { title: 'Ticket queue', blurb: 'Tickets arrive at the back and leave the queue at the support desk at the front. In auto mode the support day runs by itself.' },
        },
      },
      10: {
        title: 'Linked list', subtitle: 'Nodes and next pointers', scenario: 'Music playlist',
        lead: 'In a playlist every song hangs on the next one: each <strong>node</strong> knows its content and a <code>next</code> pointer to its successor. Nodes live anywhere in memory — you insert by re-pointing pointers, not by moving elements.',
        scenes: {
          knoten: { title: 'Re-pointing pointers', blurb: 'Four songs are scattered in memory. Pick the predecessor and insert a new song — watch which arrows change (and which nodes do not move).' },
        },
      },
      11: {
        title: 'Dictionary', subtitle: 'Key-value pairs (hash map)', scenario: 'Inventory & pricing',
        lead: 'An online shop looks up prices by item name — not by position number. A <strong>dictionary</strong> stores key-value pairs and finds any entry in practically constant time because a hash table works inside.',
        scenes: {
          hash: { title: 'Hash table', blurb: 'The key becomes a number through a hash function and lands directly in the right bucket. Store items (put) and fetch them (get).' },
        },
      },
      12: {
        title: 'Sets', subtitle: 'Collections without duplicates', scenario: 'IP whitelisting & access management',
        lead: 'A server wants to know which IPs connected — not how often. A <strong>set</strong> stores every element only once and offers set operations like intersection (<code>&amp;</code>), union (<code>|</code>) and difference (<code>-</code>).',
        scenes: {
          venn: { title: 'Set circles', blurb: 'Two sets A and B of IP addresses. Click an operation and see which areas and elements come out.' },
        },
      },
      13: {
        title: 'Recursion', subtitle: 'Functions that call themselves', scenario: 'File system explorer',
        lead: 'Folders contain folders that contain folders … nobody knows beforehand how deep it goes. <strong>Recursion</strong> solves this elegantly: a function calls itself for a smaller sub-problem — until a base case ends the chain. In the explorer a folder is a dictionary: name → sub-folder (dict) or name → file size (number).',
        scenes: {
          rekstack: { title: 'Stack during recursion', blurb: 'Every call waits for the result of the next. Only the base case returns a value, then the answers run back piece by piece.' },
          explorer: { title: 'Walking the folders', blurb: 'A recursive function visits every folder and calls itself for each sub-folder. Watch depth and file counter.' },
        },
      },
      14: {
        title: 'Sorting algorithms (bubble / merge)', subtitle: 'Compare, swap, split, merge', scenario: 'High-score list & product prices',
        lead: 'A high-score table must always be sorted. <strong>Bubble sort</strong> compares neighbours and swaps them until nothing is left to swap — simple, but slow (O(n²)). <strong>Merge sort</strong> splits the list, sorts the halves recursively and merges them (O(n log n)).',
        scenes: {
          balken: { title: 'Sorting bars', blurb: 'Every number is a bar. Choose the algorithm and go step by step (or start auto-play).' },
        },
      },
      15: {
        title: 'Binary search tree (BST)', subtitle: 'Smaller left, larger right', scenario: 'Fast product search',
        lead: 'In a <strong>binary search tree</strong> everything smaller sits in the left sub-tree, everything larger in the right one. At every node half of the candidates drop out — a product search among a million items needs only about 20 comparisons.',
        scenes: {
          suche: { title: 'Path through the tree', blurb: 'Search for a number or insert a new one. The path from the root lights up: at every node it goes left or right.' },
        },
      },
      16: {
        title: 'Tree traversals (in/pre/post)', subtitle: 'Same nodes, three orders', scenario: 'Printing & cleaning up a folder structure',
        lead: 'A <strong>traversal</strong> visits every node of a tree exactly once. The trick: all that matters is <em>when</em> the function outputs the current node — <strong>before</strong> its children (preorder), <strong>between</strong> them (inorder) or <strong>after</strong> them (postorder). The tree stays the same, only the order changes.',
        scenes: {
          wanderung: { title: 'The pointer travels', blurb: 'Choose preorder, inorder or postorder and press ▶ Step. The orange folder is the current call, the numbers show the output order. Watch the one highlighted code line: it moves depending on the mode.' },
        },
      },
      17: {
        title: 'Graphs', subtitle: 'Nodes, edges & routes', scenario: 'Public transport route planner',
        lead: 'A <strong>graph</strong> consists of <em>nodes</em> (stops) and <em>edges</em> (connections). Unlike a tree it may contain cycles and has no root. In Python you store it as an <strong>adjacency list</strong>: a dictionary that maps every stop to the list of its neighbours. <strong>BFS</strong> (level by level, finds the shortest route) and <strong>DFS</strong> (deep first, then back) run on top of it.',
        scenes: {
          routen: { title: 'Find a route: BFS & DFS', blurb: 'Click the start stop first, then the destination. Choose BFS or DFS and watch how the search explores the network — in the end the route lights up. Tip: from Hbf to Park, BFS finds the short route while DFS takes a big detour — try both with the same start and goal.' },
        },
      },
      18: {
        title: 'Classes & objects (OOP)', subtitle: 'Blueprint, instance, inheritance', scenario: 'Smart-home control',
        lead: 'A <strong>class</strong> is a blueprint, an <strong>object</strong> a concrete device built from it. Every object has its own attributes (<code>self.…</code>) but shares the methods of the class. With <strong>inheritance</strong> <code>SmartLight</code> takes over everything from <code>SmartDevice</code> and adds its own. <strong>Polymorphism</strong> means: you call the same method on every device — and each reacts in its own way.',
        scenes: {
          speicher: { title: 'Blueprint and objects', blurb: 'On the left you see the classes (blueprints), on the right the real objects appear as the lines run. Every lamp has its own values — switch on only one and see whether the other reacts.' },
        },
      },
    },
  },
};
