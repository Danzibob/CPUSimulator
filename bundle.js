(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.BNFParser = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const GenerateTM = require('./src/tm-gen.js');
const Compile = require('./src/compiler.js');
const Message = require('./src/message.js');
const Parse = require('./src/parser.js');
const types = require('./src/types.js');

const BNF_SYNTAX = {"terms":{"program":{"type":"sequence","term":"program","match":[{"type":"ref","val":"w","count":"1"},{"type":"ref","val":"#t0","count":"+"}]},"#t0":{"type":"sequence","term":"#t0","match":[{"type":"ref","val":"stmt","count":"1"},{"type":"ref","val":"w","count":"1"}]},"stmt":{"term":"stmt","type":"select","match":[{"type":"ref","val":"def"},{"type":"ref","val":"comment"}]},"comment":{"type":"sequence","term":"comment","match":[{"type":"literal","val":"#","count":"1"},{"type":"ref","val":"#t1","count":"1"},{"type":"literal","val":"\n","count":"1"}]},"#t1":{"type":"not","match":"#t2","count":"*"},"#t2":{"type":"sequence","term":"#t2","match":[{"type":"literal","val":"\n","count":"1"}]},"whitespace":{"term":"whitespace","type":"select","match":[{"type":"literal","val":" "},{"type":"literal","val":"\t"},{"type":"literal","val":"\n"},{"type":"literal","val":"\r"},{"type":"literal","val":"\n"}]},"nl":{"term":"nl","type":"select","match":[{"type":"literal","val":"\r\n"},{"type":"literal","val":"\n"}]},"w":{"type":"sequence","term":"w","match":[{"type":"ref","val":"whitespace","count":"*"}]},"letter":{"term":"letter","type":"select","match":[{"type":"literal","val":"a"},{"type":"literal","val":"b"},{"type":"literal","val":"c"},{"type":"literal","val":"d"},{"type":"literal","val":"e"},{"type":"literal","val":"f"},{"type":"literal","val":"g"},{"type":"literal","val":"h"},{"type":"literal","val":"i"},{"type":"literal","val":"j"},{"type":"literal","val":"k"},{"type":"literal","val":"l"},{"type":"literal","val":"m"},{"type":"literal","val":"n"},{"type":"literal","val":"o"},{"type":"literal","val":"p"},{"type":"literal","val":"q"},{"type":"literal","val":"r"},{"type":"literal","val":"s"},{"type":"literal","val":"t"},{"type":"literal","val":"u"},{"type":"literal","val":"v"},{"type":"literal","val":"w"},{"type":"literal","val":"x"},{"type":"literal","val":"y"},{"type":"literal","val":"z"},{"type":"literal","val":"A"},{"type":"literal","val":"B"},{"type":"literal","val":"C"},{"type":"literal","val":"D"},{"type":"literal","val":"E"},{"type":"literal","val":"F"},{"type":"literal","val":"G"},{"type":"literal","val":"H"},{"type":"literal","val":"I"},{"type":"literal","val":"J"},{"type":"literal","val":"K"},{"type":"literal","val":"L"},{"type":"literal","val":"M"},{"type":"literal","val":"N"},{"type":"literal","val":"O"},{"type":"literal","val":"P"},{"type":"literal","val":"Q"},{"type":"literal","val":"R"},{"type":"literal","val":"S"},{"type":"literal","val":"T"},{"type":"literal","val":"U"},{"type":"literal","val":"V"},{"type":"literal","val":"W"},{"type":"literal","val":"X"},{"type":"literal","val":"Y"},{"type":"literal","val":"Z"}]},"digit":{"term":"digit","type":"select","match":[{"type":"literal","val":"0"},{"type":"literal","val":"1"},{"type":"literal","val":"2"},{"type":"literal","val":"3"},{"type":"literal","val":"4"},{"type":"literal","val":"5"},{"type":"literal","val":"6"},{"type":"literal","val":"7"},{"type":"literal","val":"8"},{"type":"literal","val":"9"}]},"name":{"type":"sequence","term":"name","match":[{"type":"ref","val":"#t3","count":"1"},{"type":"ref","val":"#t4","count":"*"}]},"#t3":{"term":"#t3","type":"select","match":[{"type":"ref","val":"letter"},{"type":"literal","val":"_"}]},"#t4":{"term":"#t4","type":"select","match":[{"type":"ref","val":"letter"},{"type":"ref","val":"digit"},{"type":"literal","val":"_"}]},"constant":{"type":"sequence","term":"constant","match":[{"type":"literal","val":"\"","count":"1"},{"type":"ref","val":"#t5","count":"*"},{"type":"literal","val":"\"","count":"1"}]},"#t5":{"term":"#t5","type":"select","match":[{"type":"literal","val":"\\\""},{"type":"literal","val":"\\t"},{"type":"literal","val":"\\n"},{"type":"literal","val":"\\r"},{"type":"literal","val":"\\\\"},{"type":"ref","val":"#t6","count":"1"}]},"#t6":{"type":"not","match":"#t7","count":"+"},"#t7":{"term":"#t7","type":"select","match":[{"type":"literal","val":"\""},{"type":"literal","val":"\\"}]},"def":{"type":"sequence","term":"def","match":[{"type":"ref","val":"name","count":"1"},{"type":"literal","val":" ","count":"1"},{"type":"ref","val":"w","count":"1"},{"type":"literal","val":"::= ","count":"1"},{"type":"ref","val":"expr","count":"1"}]},"expr":{"type":"sequence","term":"expr","match":[{"type":"ref","val":"expr_p2","count":"1"},{"type":"ref","val":"#t8","count":"*"}]},"#t8":{"type":"sequence","term":"#t8","match":[{"type":"literal","val":" ","count":"1"},{"type":"ref","val":"w","count":"1"},{"type":"ref","val":"expr_p2","count":"1"}]},"expr_brackets":{"type":"sequence","term":"expr_brackets","match":[{"type":"literal","val":"( ","count":"1"},{"type":"ref","val":"w","count":"1"},{"type":"ref","val":"expr","count":"1"},{"type":"literal","val":" ","count":"1"},{"type":"ref","val":"w","count":"1"},{"type":"literal","val":")","count":"1"}]},"expr_opperand":{"term":"expr_opperand","type":"select","match":[{"type":"ref","val":"name"},{"type":"ref","val":"constant"},{"type":"ref","val":"expr_brackets"}]},"expr_p1":{"term":"expr_p1","type":"select","match":[{"type":"ref","val":"expr_p1_not"},{"type":"ref","val":"expr_p1_opt"},{"type":"ref","val":"expr_p1_orm"},{"type":"ref","val":"expr_p1_zrm"},{"type":"ref","val":"expr_opperand"}]},"expr_p1_not":{"type":"sequence","term":"expr_p1_not","match":[{"type":"literal","val":"!","count":"1"},{"type":"ref","val":"#t9","count":"1"}]},"#t9":{"term":"#t9","type":"select","match":[{"type":"ref","val":"expr_p1_opt"},{"type":"ref","val":"expr_p1_zrm"},{"type":"ref","val":"expr_p1_orm"},{"type":"ref","val":"expr_brackets"}]},"expr_p1_opt":{"type":"sequence","term":"expr_p1_opt","match":[{"type":"ref","val":"expr_opperand","count":"1"},{"type":"literal","val":"?","count":"1"}]},"expr_p1_zrm":{"type":"sequence","term":"expr_p1_zrm","match":[{"type":"ref","val":"expr_opperand","count":"1"},{"type":"literal","val":"*","count":"1"}]},"expr_p1_orm":{"type":"sequence","term":"expr_p1_orm","match":[{"type":"ref","val":"expr_opperand","count":"1"},{"type":"literal","val":"+","count":"1"}]},"expr_p2":{"term":"expr_p2","type":"select","match":[{"type":"ref","val":"expr_p2_or"},{"type":"ref","val":"expr_p1"}]},"expr_p2_or":{"type":"sequence","term":"expr_p2_or","match":[{"type":"ref","val":"expr_p1","count":"1"},{"type":"literal","val":" ","count":"1"},{"type":"ref","val":"w","count":"1"},{"type":"literal","val":"| ","count":"1"},{"type":"ref","val":"w","count":"1"},{"type":"ref","val":"expr_p2","count":"1"}]}}}

function Build (data, filename, syntax = BNF_SYNTAX){
  // Parse the file and check for errors
  let parse;
  try {
    parse = Parse(data, syntax);
  } catch(e) {
    let forward = new Error(`An internal error occured when attempting to parse the data;\n ${e.message}`);
    forward.stack = e.stack;
    throw forward;
  }

  if (parse.hasError || parse.isPartial) {	
    let ref = null;
    if (parse.tree instanceof types.BNF_SyntaxError) {
      ref = parse.tree.ref;
    } else {
      ref = parse.tree.ref.end;
    }

    let msg = filename ? `${filename}: ` : "";
    msg += `BNF did not parse correctly due to a syntax error at ${ref.toString()}\n`;
    msg += "  " + Message.HighlightArea(data, ref).split('\n').join('\n  ');
    throw new SyntaxError(msg);
  }

  // Compile the parsed result into a new tree
  let output;
  try {
    output = Compile(parse.tree);
  } catch(e) {
    throw new Error(`Compile Error: An internal error occured when attempting to compile the BNF tree;\n  ${e}`);
  }

  return output;
}

module.exports = { Compile, Parse, Build, types, BNF_SYNTAX, Message, GenerateTM };
},{"./src/compiler.js":2,"./src/message.js":3,"./src/parser.js":4,"./src/tm-gen.js":5,"./src/types.js":6}],2:[function(require,module,exports){
const {BNF_SyntaxNode, BNF_SyntaxError, BNF_Reference, BNF_Tree, BNF_Parse} = require('./types.js');

function Simplify (node) {
	switch (node.type) {
		case 'program':
			return SimplifyProgram(node);
	}

	return null;
};
function SimplifyProgram(node) {
	let out = [];

	for (let token of node.tokens[1]){
		token = token.tokens[0][0].tokens[0];
		if (token.type == "def") {
			out.push(SimplifyDef(token));
		} else if (token.type == "comment") {
			continue;
		} else {
			throw new ReferenceError("BNF Compile Error: Unknown top level data type");
		}
	}

	node.tokens = out;
	return node;
}
function SimplifyDef (node) {
	let out = [
		SimplifyName(node.tokens[0][0]),
		SimplifyExpr(node.tokens[4][0])
	];

	node.tokens = out;
	return node;
}
function SimplifyName (node) {
	let arr = node.tokens[0].concat(node.tokens[1]);
	let out = "";
	for (let i=0; i<arr.length; i++){
		if (typeof(arr[i].tokens) == "string") {
			out += arr[i].tokens;
		} else {
			out += arr[i].tokens[0].tokens;
		}
	}

	node.tokens = out;
	return node;
}
function SimplifyExpr (node) {
	let out = [SimplifyExprP2(node.tokens[0][0])]

	for (let token of node.tokens[1]) {
		out.push( SimplifyExprP2(token.tokens[2][0]) );
	}

	// Simplify recusion
	if (
		out.length == 1 &&
		(out[0].type == "expr" || out[0].type == "expr_p2_or")
	) {
		return out[0];
	}

	node.tokens = out;
	return node;
}
function SimplifyExprP2(node) {
	switch (node.tokens[0].type) {
		case 'expr_p1':
			return SimplifyExprP1(node.tokens[0]);
		case 'expr_p2_or':
			return SimplifyExprOr(node.tokens[0]);
	}

	throw new ReferenceError(`BNF Compile Error: Unknown expr_p2 expression ${node.type}`);
}
function SimplifyExprOr(node) {

	node.tokens = [
		SimplifyExprP1(node.tokens[0][0]),
		SimplifyExprP2(node.tokens[5][0]),
	];

	if (node.tokens[1].type == "expr_p2_or") {
		node.tokens = [node.tokens[0]].concat(node.tokens[1].tokens);
	}

	return node;
}
function SimplifyExprP1(node) {
	switch (node.tokens[0].type) {
		case "expr_p1_not":
			return SimplifyP1Not(node.tokens[0]);
		case "expr_p1_opt":
		case "expr_p1_orm":
		case "expr_p1_zrm":
			return SimplifyP1(node.tokens[0]);
		case "expr_opperand":
			return SimplifyExprOpperand(node.tokens[0]);
	}

	throw new ReferenceError(`BNF Compile Error: Unknown expr_p1 expression ${node.tokens[0].type}`);
}
function SimplifyP1Not (node) {
	let inner = node.tokens[1][0].tokens[0];	
	switch (inner.type) {
		case "expr_brackets":
			node.tokens = [SimplifyBrackets(inner)];
			break;
			case "expr_p1_opt":
			case "expr_p1_orm":
			case "expr_p1_zrm":
				node.tokens = [SimplifyP1(inner)];
				break;
			default:
				throw new ReferenceError(`BNF Compile Error: Unexpected not of "${inner.type}"`);
	}

	return node;
}
function SimplifyP1 (node) {
	node.tokens = SimplifyExprOpperand(node.tokens[0][0]);
	return node;
}
function SimplifyExprOpperand(node){
	switch (node.tokens[0].type) {
		case "name":
			return SimplifyName(node.tokens[0]);
		case "constant":
			return SimplifyConstant(node.tokens[0]);
		case "brackets": // legacy
		case "expr_brackets":
			return SimplifyBrackets(node.tokens[0]);
	}

	throw new ReferenceError(`BNF Compile Error: Unknown expr_opperand expression ${node.tokens[0].type}`);
}
function SimplifyConstant(node) {
	let str = "";
	for (let term of node.tokens[1]){
		if (typeof(term.tokens) == "string") {
			str += term.tokens
		} else {
			str += term.tokens[0].tokens;
		}
	}

	node.tokens = str;
	return node;
}
function SimplifyBrackets(node) {
	return SimplifyExpr(node.tokens[2][0]);
}



/**
 * Compiles a parsed BNF into a BNF tree
 * @param {BNF_SyntaxNode} tree 
 * @returns {BNF_Tree} BNF tree
 */
function Compile(tree) {
	tree = Simplify(tree);

	let tempNo = 0;
	let out = {};

	function GenerateTerminal(name, expr) {
		if (out[name]) {
			throw new ReferenceError(`BNF Compilation: Multiple occurances of term name ${name}`);
		}

		if (expr.type == "expr_p2_or") { // Select
			out[name] = {
				term: name,
				type: "select",
				match: []
			};

			for (let opt of expr.tokens){
				if (opt.type == "constant") {
					out[name].match.push({
						type: "literal",
						val: opt.tokens
					});
				} else if (opt.type == "name") {
					out[name].match.push({
						type: "ref",
						val: opt.tokens
					});
				} else {
					let temp = `#t${tempNo++}`;
					out[name].match.push({
						type: "ref",
						val: temp,
						count: "1"
					});
					GenerateTerminal(temp, opt);
				}
			}
		} else if (expr.type == "expr_p1_not") {
			let inner = expr.tokens[0];
			let count = "1";

			switch (inner.type) {
				case "expr_p1_opt":
					inner = inner.tokens;
					count = "?";
					break;
				case "expr_p1_orm":
					inner = inner.tokens;
					count = "+";
					break;
				case "expr_p1_zrm":
					inner = inner.tokens;
					count = "*";
					break;
			}

			// If the not is just a single reference then there is no point creating a new temp namespace
			if (inner.type == "expr" &&
				inner.tokens.length == 1 && inner.tokens[0].type == "name"
			) {
				out[name] = {
					type: "not",
					term: name,
					match: inner.tokens[0].tokens,
					count: count
				};
				return out;
			}
			
			let temp = `#t${tempNo++}`;
			out[name] = {
				type: "not",
				match: temp,
				count: count
			};
			GenerateTerminal(temp, inner);
		} else {                         // Sequence
			out[name] = {
				type: "sequence",
				term: name,
				match: []
			};

			for (let opt of expr.tokens) {
				let term = opt;
				let count = "1";
				if        (opt.type == "expr_p1_opt") {
					term = term.tokens;
					count = "?"
				} else if (opt.type == "expr_p1_zrm") {
					term = term.tokens;
					count = "*"
				} else if (opt.type == "expr_p1_orm") {
					term = term.tokens;
					count = "+"
				}

				if (term.type == "name") {
					out[name].match.push({
						type: "ref",
						val: term.tokens,
						count: count
					});
				} else if (term.type == "constant") {
					out[name].match.push({
						type: "literal",
						val: term.tokens,
						count: count
					});
				} else {
					let temp = `#t${tempNo++}`;
					out[name].match.push({
						type: "ref",
						val: temp,
						count: count
					});
					GenerateTerminal(temp, term);
				}
			}
		}
	}

	for (let term of tree.tokens) {
		GenerateTerminal(term.tokens[0].tokens, term.tokens[1]);
	}

	let out_tree = new BNF_Tree(out);
	out_tree.check();

	return out_tree;
};


module.exports = Compile;
},{"./types.js":6}],3:[function(require,module,exports){
const {BNF_SyntaxNode, BNF_SyntaxError, BNF_Reference, BNF_Tree, BNF_Parse} = require('./types.js');

function HighlightArea(input, fromRef, toRef){
  let index = fromRef.index;

  function IsInBound(col) {
    if (fromRef && toRef) {
      return fromRef.col <= col && col <= toRef.col;
    }
    if (fromRef && fromRef.col <= col) {
      return true;
    }
    if (toRef && col <= toRef.col) {
      return true;
    }
  }

  // Get the previous newline
  let begin;
  for (begin=index; 0<begin; begin--) {
    if (input[begin] == "\n") {
      begin++;
      break;
    }
  }
  // Move backforward past whitespace
  let colShift = 0;
  for (; begin<input.length; begin++){
    if (input[begin] == " " | input[begin] == "\t") {
      colShift++;
      continue;
    } else {
      break;
    }
  }

  // Get the next newline
  let end;
  for (end=index; end<input.length; end++) {
    if (input[end] == "\n") {
      break;
    }
  }

  let snippet = input.slice(begin, end);
  let area = "";
  let lineLen = end-begin;
  for (let col=1+colShift; col<lineLen+colShift; col++) {
    area += col == fromRef.col ? "^" : ( IsInBound(col) ? "~" : " ");
  }

  return snippet + "\n" + area;
}


module.exports = {
  HighlightArea
};
},{"./types.js":6}],4:[function(require,module,exports){
const {BNF_SyntaxNode, BNF_SyntaxError, BNF_Reference, BNF_Tree, BNF_Parse} = require('./types.js');


function Process_Literal_String (string) {
	return string.replace(/\\t/g, "\t")
	.replace(/\\r/g, "\r")
	.replace(/\\n/g, "\n")
	.replace(/\\"/g, "\"")
	.replace(/\\\\/g, "\\");
}

function Process_Select   (input, tree, branch, stack = [], ref){
	let best = null;

	for (let target of branch.match) {
		if (target.type == "literal") {
			if (input.slice(0, target.val.length) == target.val) {
				return new BNF_SyntaxNode (
					branch.term,
					Process_Literal_String(target.val),
					target.val.length,
					ref,
					ref.duplicate().shiftByString(target.val)
				);
			}
		} else if (target.type == "ref") {
			let res = Process(input, tree, target.val, [...stack], ref);
			if (res instanceof BNF_SyntaxNode) {
				return new BNF_SyntaxNode(branch.term, [res], res.consumed, ref, res.ref.end);
			} if (best === null || res.getReach().isGreater( best.getReach() )) {
				best = res;
			}
		} else {
			throw new TypeError(`Malformed tree: Invalid match type ${target.type}`);
		}
	}

	if (best) {
		return new BNF_SyntaxError(ref, best.remaining, branch, "PSL_1_Best").setCause(best);
	}

	return new BNF_SyntaxError(ref, input, branch, "PSL_1");
}
function Process_Sequence(input, tree, branch, stack = [], localRef) {
	let startRef = localRef.duplicate();

	function MatchOne(target, string, localRef) {		
		if (target.type == "literal") {
			if (string.slice(0, target.val.length) == target.val) {
				return new BNF_SyntaxNode(
					"literal",
					[ Process_Literal_String(target.val) ],
					target.val.length,
					localRef,
					localRef.duplicate().shiftByString(target.val)
				);
			} else {
				return new BNF_SyntaxError(localRef, string, {
					term: `"${target.val}"`,
					type: target.type
				}, "PSQ_O_1");
			}
		} else if (target.type == "ref") {
			return Process(string, tree, target.val, [...stack], localRef);
		}

		throw new ReferenceError(`Malformed tree: Invalid selector match type ${target.type}`);
	}

	function MatchZeroToMany(target, string, localRef) {
		let sub = [];
		let res = new BNF_SyntaxNode("null", [], 0, new BNF_Reference(), new BNF_Reference());

		while (res instanceof BNF_SyntaxNode) {
			res = MatchOne(target, string, localRef.duplicate());

			if (res instanceof BNF_SyntaxNode) {
				localRef = res.ref.end;
				string = string.slice(res.consumed);
				sub.push(res);

				// Stop consuming 0 tokens infinitly
				// But at least consume it once as it is a valid parse for ==1 >=1
				if (res.consumed == 0) {
					break;
				}
			}
		}

		let reach = new BNF_SyntaxError(localRef, string, branch, "SEQ_ZME");
		if (res instanceof BNF_SyntaxError) {
			reach.setCause(res);
		}

		return {
			data: sub,
			reached: reach
		};
	}

	let prevErr = null;
	let consumed = 0;
	let out = [];
	for (let target of branch.match) {
		if (!target.count) { target.count = "1"; } // lazy load
		let sub = [];

		// Match tokens
		if (target.count == "?" || target.count == "1") {
			let res = MatchOne(target, input, localRef.duplicate());
			if (res instanceof BNF_SyntaxNode) {
				sub = [res];
			} else if (res instanceof BNF_SyntaxError) {
				if (prevErr === null || res.getReach().isGreater(prevErr.getReach())) {
					prevErr = res;
				}
			}
		} else if (target.count == "*" || target.count == "+") {
			let res = MatchZeroToMany(target, input, localRef.duplicate());
			if (prevErr === null || res.reached.getReach().isGreater(prevErr.getReach())) {
				prevErr = res.reached;
			}
			sub = res.data;
		}

		// Shift the search point forwards to not search consumed tokens
		let shift = 0;
		if (sub.length > 0) {
			localRef = sub[sub.length-1].ref.end;

			shift = sub.reduce((prev, curr) => {
				return ( prev instanceof BNF_SyntaxNode ? prev.consumed : prev ) + curr.consumed;
			});
			if (shift instanceof BNF_SyntaxNode) {
				shift = shift.consumed;
			}
		}
		input = input.slice(shift);
		consumed += shift;

		// Get reach
		let last = sub[sub.length-1];
		if (last instanceof BNF_SyntaxNode) {
			if (last.reached &&
				(
					prevErr === null ||
					last.reached.getReach().isGreater(prevErr.getReach())
				)
			) {
				prevErr = last.reached;
			}
		}

		// Check number of tokens
		if (
			sub.length == 0 ? ( target.count == "+" || target.count == "1" ) : false ||
			sub.length > 1  ? ( target.count == "1" || target.count == "?" ) : false
		) {
			return new BNF_SyntaxError(startRef, input, {...branch, stage: target}, "PSQ_1")
				.setCause(prevErr);
		}

		out.push(sub);
		stack = [];
	}

	return new BNF_SyntaxNode(branch.term, out, consumed, startRef, localRef, prevErr);
}
function Process_Not(input, tree, branch, stack = [], localRef) {
	let ran = false;
	let res = false;
	let out = "";

	let startRef = localRef.duplicate();

	let atLeastOne = branch.count == "+" || branch.count == "1";
	let atMostOne = branch.count == "?" || branch.count == "1";

	while (!(res instanceof BNF_SyntaxNode)) {
		if (input.length == 0) {
			break;
		}

		// Stop at one
		if (atMostOne && out.length >= 1) {
			break;
		}

		res = Process(input, tree, branch.match, [...stack], localRef);

		if (res instanceof BNF_SyntaxError) {
			ran = true;
			out += input[0];
			localRef.shiftByString(input[0]);

			input = input.slice(1);
			stack = [];
		}

	}

	if (
		(atMostOne ? (out.length <= 1) : true) &&
		(atLeastOne ? (1 <= out.length) : true)
	) {
		return new BNF_SyntaxNode(branch.term, out, out.length, startRef, localRef);
	} else {
		return new BNF_SyntaxError(startRef, input, branch, "PN_1")
			.setCause(new BNF_SyntaxError(localRef, input, branch.term, "PN_I"));
	}
}


function Process (input, tree, term, stack = [], ref) {
	let branch = tree.terms[term];
	if (!branch) {
		console.error(term);
		throw new ReferenceError(`Malformed Tree: Unknown branch name ${term} of tree`);
	}

	// Infinite loop detection
	let i = stack.indexOf(term);
	if (i != -1) {
		// Allow one layer of recursion
		if (stack.slice(i+1).indexOf(term) != -1) {
			throw new EvalError("Malformed BNF: BNF is not deterministic")
		}
	}
	stack.push(term);

	if (branch === undefined) {
		throw new ReferenceError(`Invalid tree term "${term}"`);
	}

	if (!(ref instanceof BNF_Reference)) {
		ref = new BNF_Reference();
	}

	// Duplicate the reference so the following functions won't modify the original
	let forwardRef = ref.duplicate();

	let out = null;
	if (branch.type == "select") {
		out = Process_Select(input, tree, branch, stack, forwardRef);
	} else if (branch.type == "sequence") {
		out = Process_Sequence(input, tree, branch, stack, forwardRef);
	} else if (branch.type == "not") {
		out = Process_Not(input, tree, branch, stack, forwardRef);
	} else {
		throw new ReferenceError(`Malformed tree: Invalid term type ${branch.type}`);
	}

	if (out instanceof BNF_SyntaxError || out instanceof BNF_SyntaxNode) {
		return out;
	}

	throw new TypeError(`Invalid return type of internal component from ${branch.term}:${branch.type}`);
}





/**
 * The supplied string will be turned into a token tree as specified by the tree
 * @param {String} data 
 * @param {BNF_Tree} tree BNF tree
 * @param {String} entry 
 * @returns {BNF_Parse}
 */
function Parse(data, tree, entry="program") {
	let ref = new BNF_Reference();

	let res = Process(data, tree, entry, [], ref);
	return new BNF_Parse(res, data.length);
}

module.exports = Parse;
},{"./types.js":6}],5:[function(require,module,exports){
const { BNF_Tree } = require('./types.js');
const { GenerateTM } = require('../index.js');



function GenerateTextMate (tree, topLevel, langName, langExt, means) {
	if (topLevel === undefined) {
		throw new Error("Must specify top level name argument");
	}
	if (langName === undefined) {
		throw new Error("Must specify language name argument");
	}

	// Cache generated regex for certain terms
	// let cache = {};
	function GenerateRegex(term) {
		function CountStr(str) {
			switch (str) {
				case undefined:
				case "1":
					return "";
				case "*":
				case "?":
				case "+":
					return str;
			}
		}

		if (term.type == "literal") {
			return term.val+CountStr(term.count);
		} else if (term.type == "not") {
			return `?!(${GenerateRegex({type: "ref", val: term.match})})${CountStr(term.count)}`;
		} else {
			return ".*?";
		}

		// if (term.type == "literal") {
		// 	return term.val+CountStr(term.count);
		// } else if (term.type == "not") {
		// 	return `?!(${GenerateRegex({type: "ref", val: term.match})})${CountStr(term.count)}`;
		// } else {
		// 	if (cache[term.val]) {
		// 		return cache[term.val];
		// 	} else {
		// 		cache[term.val] = ".*?"; // catch for recursion
		// 	}

		// 	let target = tree.terms[term.val];
		// 	let reg = [];
		// 	if (target.type == "not") {
		// 		reg.push(`?!(${GenerateRegex({type: "ref", val: target.match})})${CountStr(target.count)}`);
		// 	} else {
		// 		for (let node of target.match) {
		// 			reg.push(GenerateRegex(node));
		// 		}
		// 	}
			

		// 	if (target.type == "select") {
		// 		reg = reg.join('|');
		// 	} else {
		// 		reg = reg.map(x => `${x}`).join('');
		// 	}

		// 	cache[term.val] = reg;
		// 	return reg+CountStr(term.count);
		// }
	}


	let out = {
		name: langName,
		scopeName: `source.${langExt}`,
		patterns: [],
		repository: {}
	};

	function GenerateRepo(name) {
		if (out.repository[name]) {
			return;
		}

		let patterns = [];
		out.repository[name] = {
			patterns: patterns
		};
		let target = tree.terms[name];
		if (target.type == "select") {
			for (let node of target.match) {
				if (node.type == "ref") {
					patterns.push({
						include: `#${node.val}`,
					});
				} else {
					patterns.push({
						match: `${node.val}`
					});
				}
			}
		} else if (target.type == "not") {
			patterns.push({
				match: GenerateRegex(target)
			});
		} else {
			let pat = {
				name: means[name],
				match: "",
				capture: {}
			};


			let i = 0;
			for (let node of target.match) {
				pat.match += `(${GenerateRegex(node)})`;
				if (node.type == "ref") {
					pat.capture[i] = {
						patterns: [ {include: `#${node.val}`} ]
					};
					GenerateRepo(node.val);
				}
				i++;
			}

			patterns.push(pat);
		}
	}

	// Check the starting point type is valid
	if (tree.terms[topLevel].type != "select") {
		throw new Error("Argument topLevel must specify a select type term");
	}

	// Generate the pattern match for all required patterns
	for (let node of tree.terms[topLevel].match) {
		out.patterns.push({ include: `#${node.val}`});
		GenerateRepo(node.val);
	}

	return out;
}

module.exports = GenerateTextMate;
},{"../index.js":1,"./types.js":6}],6:[function(require,module,exports){

/**
 * @class
 * @public
 * @property {Number} line
 * @property {Number} col
 * @property {String} index
 */
class BNF_Reference {
	constructor(line = 1, col = 1, index = 0) {
		this.line  = line;
		this.col   = col
		this.index = index;
	}

	/**
	 * Creates an exact duplicate object of this reference
	 */
	duplicate() {
		return new BNF_Reference(this.line, this.col, this.index);
	}

	/**
	 * Shift the reference forward by one character
	 */
	shiftCol() {
		this.index++;
		this.col++;

		return this;
	}
	/**
	 * Shift the reference forward one line
	 */
	shiftLine(){
		this.index++;
		this.line++;
		this.col = 1;

		return this;
	}
	/**
	 * Shift the reference based on the string data
	 * @param {String} str 
	 */
	shiftByString(str) {
		for (let i=0; i<str.length; i++) {
			if (str[i] == "\n") {
				this.shiftLine();
			} else {
				this.shiftCol();
			}
		}

		return this;
	}

	/**
	 * this > other
	 * @param {BNF_Reference} other 
	 */
	isGreater(other) {
		if (this.line > other.line) {
			return true;
		}
		if (this.line == other.line && this.col > other.col) {
			return true;
		}

		return false;
	}

	/**
	 * Converts the reference to a string
	 */
	toString() {
		return `(${this.line}:${this.col})`;
	}
};

/**
 * @class
 * @pubilc
 * @property {BNF_Reference} ref
 * @property {String} remaining
 * @property {Object} branch
 * @property {String} code
 */
class BNF_SyntaxError {
	constructor(ref, remaining, branch, code=null){
		this.ref = ref;
		// this.remaining = remaining;
		this.branch = branch;
		this.code = code;
		this.cause = null;
	}

	/**
	 * Change the cause of the error
	 * @param {BNF_SyntaxError} other 
	 * @returns {BNF_SyntaxError}
	 */
	setCause(other) {
		if (other === null) {                             // Remove the cause
			this.cause = null;
		} else if (!(other instanceof BNF_SyntaxError)) { // Invalid cause
			console.error(other);
			throw new TypeError(`Invalid type "${other.constuctor.name}" parsed as BNF_SyntaxError cause`);
		} else {                                          // Update cause
			this.cause = other;
		}
		
		return this;
	}

	getCausation(simple = false){
		// Ignore temporary types if possible
		if (this.branch.term.slice(0,2) == "#t"){
			if (this.cause) {
				return this.cause.getCausation(simple);
			} else if (!simple) {
				return `${this.branch.term}:${this.branch.type.slice(0,3)} ${this.ref.toString()}`;
			}
		}

		let out = `${this.branch.term}`;
		if (!simple) {
			out += `:${this.branch.type.slice(0,3)} ${this.ref.toString()}`;
		}
		if (this.cause) {
			out += " -> " + this.cause.getCausation(simple);
		}

		return out;
	}

	getReach() {
		if (this.cause) {
			return this.cause.getReach();
		} else {
			return this.ref;
		}
	}
}

/**
 * @class
 * @public
 * @property {String} type
 * @property {String|BNF_SyntaxNode[][]} tokens
 * @property {Number} consumed
 */
class BNF_SyntaxNode {
	constructor(type, tokens, consumed, refStart, refEnd, reached = null) {
		if (!(refStart instanceof BNF_Reference)) {
			throw new TypeError("refStart must be of type BNF_Reference");
		}
		if (!(refEnd instanceof BNF_Reference)) {
			throw new TypeError("refEnd must be of type BNF_Reference");
		}
		if (isNaN(consumed) || consumed < 0) {
			throw new TypeError("consumed must be a valid number")
		}

		this.type     = type;
		this.tokens   = tokens;
		this.ref = {
			start: refStart,
			end: refEnd,
			reached: reached
		};
	}

	get consumed(){
		return this.ref.end.index - this.ref.start.index;
	}
}

/**
 * @class
 * @private
 * @property {Object} terms
 */
class BNF_Tree {
	constructor(terms = {}) {
		this.terms = terms;
	}

	check() {
		let risk = 0;

		for (let name in this.terms) {
			let valid = false;
			for (let match of this.terms[name].match) {
				if (match.count !== "*") {
					valid = true;
					break;
				}
			}

			if (!valid) {
				risk++;
				console.warn(`Attempting to compile tree where branch ${name} are all zero to many`);
			}
		}

		return risk;
	}

	/**
	 * Creates a BNF_Tree based off a JSON input
	 * @param {Object} jsonObj A parsed JSON file
	 */
	static fromJSON(jsonObj) {
		return new BNF_Tree(jsonObj.terms);
	}
}

/**
 * @class
 * @public
 * @property {BNF_SyntaxNode} tree
 * @property {Boolean} isPartial
 * @property {Boolean} hasError
 */
class BNF_Parse {
	constructor(res, dataLen) {
		this.hasError  = res instanceof BNF_SyntaxError;
		this.isPartial = res.consumed != dataLen;
		this.tree      = res;
	}
}

module.exports = {
	BNF_SyntaxNode, BNF_SyntaxError, BNF_Reference, BNF_Tree, BNF_Parse
}
},{}]},{},[1])(1)
});
