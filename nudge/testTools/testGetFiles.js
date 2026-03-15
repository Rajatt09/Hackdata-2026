const {listFiles, sendFile, findFilesByName} = require('./../tools/getfiles');
 
async function test() {
    
    const mockGeminiResponse = {
        functionCalls: [
            {
                name: 'findFilesByName',
                args: { fileName: 'package.json' }
            },
            {
                name: 'findFilesByName',
                args: { fileName: 'cmd.exe', searchRoot: 'C:\\Windows\\System32' }
            }
        ]
    };

    const results = await Promise.all(
        mockGeminiResponse.functionCalls.map(async (call) => {
            return await findFilesByName(call.args.fileName, call.args.searchRoot);
        })
    );
    
    console.log(JSON.stringify(results, null, 2));

}

test();
