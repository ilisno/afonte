import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button'; // Using shadcn Button
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Using shadcn Card
import { DollarSign, Target, Clock, LineChart, Zap, Heart, Scale, Dumbbell } from 'lucide-react'; // Importing icons
import MonEspacePreviewTable from '@/components/MonEspacePreviewTable'; // Import the new component
import StrengthProgressChart from '@/components/StrengthProgressChart'; // Import the new chart component

const Index: React.FC = () => {

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
        {/* Main Heading and Subtitle */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Tes outils pour <br className="hidden md:block"/>
          <span className="bg-sbf-red text-white px-3 py-1 rounded-md inline-block mt-2 md:mt-0">
            transformer ton physique
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl">
          Obtenez votre programme de musculation personnalisé pour 10x moins cher qu'un coaching classique.
        </p>

        {/* Placeholder for Illustration */}
        {/* <div className="mb-8">[Illustration de personnes s'entraînant]</div> */}

        {/* Call To Action Button */}
        <Button
          asChild // Use asChild to render as a Link
          // Updated classes for red background, white text, yellow border, and rounded corners
          className="bg-sbf-red text-white hover:bg-sbf-yellow hover:text-sbf-red text-lg px-8 py-6 rounded-md font-semibold shadow-lg transition-colors duration-300 border-2 border-sbf-yellow"
        >
           <Link to="/programme">Créer mon programme</Link>
        </Button>

        {/* Mon Espace Static Preview Section (using the new component) */}
        <section className="mt-16 w-full max-w-4xl text-center">
            {/* Updated Section Title */}
            <h2 className="text-3xl font-bold text-gray-800 mb-8">
                Tes performances après nous avoir rejoint
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Enregistrez vos performances, suivez l'évolution de vos charges et restez motivé avec votre historique d'entraînement.
            </p>
            {/* Render the new preview component */}
            <div className="w-full flex justify-center mb-8"> {/* Wrapper to center the card, added mb-8 */}
               <MonEspacePreviewTable />
            </div>

            {/* Add the animated chart here */}
            <div className="w-full max-w-3xl mx-auto mb-8"> {/* Wrapper for the chart, added mb-8 */}
                <StrengthProgressChart />
            </div>

             <div className="mt-8">
                <Button
                   asChild
                   className="bg-sbf-red text-white hover:bg-sbf-yellow hover:text-sbf-red text-lg px-8 py-6 rounded-md font-semibold shadow-lg transition-colors duration-300 border-2 border-sbf-yellow"
               >
                  <Link to="/mon-espace">Aller à Mon Espace</Link>
               </Button>
             </div>
        </section>


        {/* Separator Line */}
        <hr className="w-full max-w-4xl my-12 border-gray-300" />


        {/* Benefits Section 1 (Moved Down) */}
        <section className="mt-16 w-full max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Le coaching réinventé, c'est surtout
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white shadow-md flex flex-col items-center text-center p-6"> {/* Added flex, items-center, text-center, p-6 */}
              <DollarSign size={40} className="text-sbf-red mb-3" /> {/* Added Icon */}
              <CardHeader className="p-0 mb-3"> {/* Adjusted padding */}
                <CardTitle className="text-gray-800 text-xl font-semibold">ÉCONOMISEZ GROS</CardTitle> {/* Changed text color */}
              </CardHeader>
              <CardContent className="p-0"> {/* Adjusted padding */}
                <p className="text-gray-600">L'efficacité d'un pro, le prix en moins.</p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-md flex flex-col items-center text-center p-6"> {/* Added flex, items-center, text-center, p-6 */}
              <Target size={40} className="text-sbf-red mb-3" /> {/* Added Icon */}
              <CardHeader className="p-0 mb-3"> {/* Adjusted padding */}
                <CardTitle className="text-gray-800 text-xl font-semibold">SUR MESURE TOTAL</CardTitle> {/* Changed text color */}
              </CardHeader>
              <CardContent className="p-0"> {/* Adjusted padding */}
                <p className="text-gray-600">Un programme unique, fait pour vous.</p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-md flex flex-col items-center text-center p-6"> {/* Added flex, items-center, text-center, p-6 */}
              <Clock size={40} className="text-sbf-red mb-3" /> {/* Added Icon */}
              <CardHeader className="p-0 mb-3"> {/* Adjusted padding */}
                <CardTitle className="text-gray-800 text-xl font-semibold">LIBERTÉ MAXIMALE</CardTitle> {/* Changed text color */}
              </CardHeader>
              <CardContent className="p-0"> {/* Adjusted padding */}
                <p className="text-gray-600">Entraînez-vous où et quand vous voulez.</p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-md flex flex-col items-center text-center p-6"> {/* Added flex, items-center, text-center, p-6 */}
              <LineChart size={40} className="text-sbf-red mb-3" /> {/* Added Icon */}
              <CardHeader className="p-0 mb-3"> {/* Adjusted padding */}
                <CardTitle className="text-gray-800 text-xl font-semibold">RÉSULTATS VISIBLES</CardTitle> {/* Changed text color */}
              </CardHeader>
              <CardContent className="p-0"> {/* Adjusted padding */}
                <p className="text-gray-600">Progressez plus vite grâce à un plan optimisé.</p>
              </CardContent>
            </Card>
          </div>
        </section>


        {/* Separator Line */}
        <hr className="w-full max-w-4xl my-12 border-gray-300" />


        {/* Benefits Section 2 - Life Improvement */}
        <section className="mt-16 w-full max-w-4xl text-left"> {/* Align text left */}
           <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center"> {/* Center heading */}
             Comment SmoothieBananeFraise va changer votre vie
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8"> {/* Two columns on medium screens */}
             <div className="flex items-start space-x-4"> {/* Align items to start */}
               <Zap size={30} className="text-sbf-red flex-shrink-0 mt-1" /> {/* Icon */}
               <div>
                 <p className="font-bold text-gray-800">Plus d'énergie au quotidien</p>
                 <p className="text-gray-600 text-sm">Un corps plus fort, c'est une vitalité décuplée pour affronter vos journées.</p>
               </div>
             </div>
             <div className="flex items-start space-x-4">
               <Heart size={30} className="text-sbf-red flex-shrink-0 mt-1" /> {/* Icon */}
               <div>
                 <p className="font-bold text-gray-800">Meilleure santé globale</p>
                 <p className="text-gray-600 text-sm">Réduisez les risques de maladies et améliorez votre bien-être général.</p>
               </div>
             </div>
             <div className="flex items-start space-x-4">
               <Scale size={30} className="text-sbf-red flex-shrink-0 mt-1" /> {/* Icon */}
               <div>
                 <p className="font-bold text-gray-800">Confiance en soi boostée</p>
                 <p className="text-gray-600 text-sm">Voir votre corps se transformer renforce votre estime et votre mental.</p>
               </div>
             </div>
             <div className="flex items-start space-x-4">
               <Dumbbell size={30} className="text-sbf-red flex-shrink-0 mt-1" /> {/* Icon */}
               <div>
                 <p className="font-bold text-gray-800">Des résultats concrets et durables</p>
                 <p className="text-gray-600 text-sm">Suivez un plan structuré pour atteindre vos objectifs physiques efficacement.</p>
               </div>
             </div>
           </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default Index;