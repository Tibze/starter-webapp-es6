$(() => {
	let $dummyContent = $('.dummy-content');
	let dummyObject = new DummyObject({el:$dummyContent});
	dummyObject.sayHello('Hello Starter-webapp-es6 !')
});