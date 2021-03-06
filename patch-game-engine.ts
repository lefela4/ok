import * as minimist from 'minimist';
import fetch from "node-fetch/index";
import * as jsb from "js-beautify";
import {writeFileSync} from "fs";

console.log(minimist);

const args = minimist(process.argv.slice(2));

if(args._.length != 1) {
    console.error('Please provide version number!');
    process.exit(2);
}

const version = args._[0];

(async () => {
    let req = await fetch(`http://generals.io/generals-main-prod-v${version}.js`);
    if(req.status !== 200) {
        console.error('Cannot fetch generals.io engine!');
        process.exit(3);
    }
    let jsFile = await req.text();
    //

    console.log('downloaded', jsFile.length);

    const changeset = [
        [/(var)( )((?:[a-z][a-z0-9_]*))(;)(return)( )((?:[a-z][a-z0-9_]*))(\.)(map_diff)(&)(&)/i , 'var x; $1$2$3$4\n$7$8$9$10$11$12'],
        [/(Object\.assign\(\{\})(,)((?:[a-z][a-z0-9_]*))(,)((?:[a-z][a-z0-9_]*))(\))(;)(case)( )((?:[a-z][a-z0-9_]*))(\.)(ACTION_LOSE)(:)/i , 'x =$1$2$3$4$5$6$7 \n return window.ai.applyUpdate(x);$8$9$10$11$12$13'],
        [/(stopListenForPublicCustoms)(:)((?:[a-z][a-z0-9_]*))(,)(clearNotif)(:)((?:[a-z][a-z0-9_]*))(\})/i , ';$1$2$3$4$5$6$7$8\n window.gameCtrl = e.exports;']
    ];

    let n = 0;
    for(const change of changeset) {
        if(!jsFile.match(<any>change[0])) {
			console.log(change[0]);
            console.error(`patch ${n} failed!`);
            process.exit(4);
        }
        jsFile = jsFile.replace(<any>change[0], <string>change[1]);
        n++;
    }

    console.log('patching completed!');

	let formattedFile = jsb(jsFile);

    writeFileSync("../generals.js", formattedFile);

    console.log(`engine updated to ${version} successfully :)`);

})();
