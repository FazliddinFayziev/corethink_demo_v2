export const template = `


     
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset='UTF-8'>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Corethink app</title>
          <link href="https://cdn.jsdelivr.net/npm/daisyui@4.6.0/dist/full.min.css" rel="stylesheet" type="text/css" />
          <script src="https://cdn.tailwindcss.com"></script>
          <script src='https://unpkg.com/react@17/umd/react.production.min.js'></script>
          <script src='https://unpkg.com/react-dom@17/umd/react-dom.production.min.js'></script>
          <script src='https://unpkg.com/react-router-dom@5.0.0/umd/react-router-dom.min.js'></script>
          <script src='https://unpkg.com/babel-standalone@6.26.0/babel.js'></script>
          <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
        </head>
        <body>
          <div id='root'></div>
          <script type='text/babel'>const Home = () => {
  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <div className="hero min-h-screen bg-[url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655')] bg-fixed bg-center">
        <div className="hero-overlay bg-opacity-60"></div>
        <div className="hero-content text-center text-neutral-content">
          <div className="max-w-md">
            <h1 className="mb-5 text-5xl font-bold text-white">Wedo Edu</h1>
            <p className="mb-5 text-lg">Shaping minds, building futures. Your premier educational partner for academic excellence and lifelong learning.</p>
            <button className="btn btn-primary">Get Started</button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="py-20 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg max-w-2xl mx-auto">Empowering students through innovative education solutions and personalized learning experiences that inspire growth and achievement.</p>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-20 bg-base-200">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <figure><img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2" alt="Team Member" className="w-full h-64 object-cover"/></figure>
              <div className="card-body">
                <h3 className="card-title">Sarah Johnson</h3>
                <p>Educational Director</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <figure><img src="https://images.unsplash.com/photo-1560250097-0b93528c311a" alt="Team Member" className="w-full h-64 object-cover"/></figure>
              <div className="card-body">
                <h3 className="card-title">Michael Chen</h3>
                <p>Curriculum Specialist</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <figure><img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e" alt="Team Member" className="w-full h-64 object-cover"/></figure>
              <div className="card-body">
                <h3 className="card-title">Emily Rodriguez</h3>
                <p>Student Success Coach</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Observe Section */}
      <div className="py-20 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1')] bg-fixed bg-cover bg-center">
        <div className="container mx-auto px-4">
          <div className="bg-base-100 bg-opacity-90 p-8 rounded-lg max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-8">Transform Your Future</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">500+</div>
                <p>Students Enrolled</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">95%</div>
                <p>Success Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer p-10 bg-neutral text-neutral-content">
        <div>
          <h2 className="text-2xl font-bold">Wedo Edu</h2>
          <p>Providing reliable education since 2020</p>
        </div> 
        <div>
          <span className="footer-title">Contact</span> 
          <a className="link link-hover">About us</a> 
          <a className="link link-hover">Contact</a> 
          <a className="link link-hover">Programs</a>
        </div> 
        <div>
          <span className="footer-title">Legal</span> 
          <a className="link link-hover">Terms of use</a> 
          <a className="link link-hover">Privacy policy</a> 
          <a className="link link-hover">Cookie policy</a>
        </div>
      </footer>
    </div>
  );
};

      const { Link, Route, MemoryRouter } = ReactRouterDOM;

      const App = () => {
        return (
    <MemoryRouter initialEntries={["/"]} initialIndex={0}>
                <Route path="/" exact component={Home} />
    </MemoryRouter>
  );
      };

      ReactDOM.render(<App />, document.querySelector('#root'));
    
</script>
        </body>
      </html>
    

`