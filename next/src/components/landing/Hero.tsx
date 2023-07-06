import FadeIn from "../motions/FadeIn";
import BannerBadge from "../BannerBadge";
import clsx from "clsx";
import PrimaryButton from "../PrimaryButton";
import Backing from "./Backing";
import React from "react";
import { useRouter } from "next/router";
import Image from "next/image";

const Hero = () => {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
      <div className="z-10 col-span-1">
        <FadeIn duration={1.5} delay={0}>
          <div className="mb-2">
            <BannerBadge href="https://calendly.com/reworkdai/enterprise-customers" target="_blank">
              <span className="sm:hidden">Shape AI agents for your business</span>
              <span className="hidden sm:inline">
                Shape the future of AI agents for your business
              </span>
            </BannerBadge>
          </div>
          <h1
            className={clsx(
              "pb-2 text-left text-5xl sm:text-6xl md:text-7xl xl:text-8xl",
              "bg-clip-text text-transparent",
              "bg-gradient-to-br from-white to-neutral-600",
              "leading-[1.1em] tracking-[-0.5px]"
            )}
          >
            <div>
              Autonomous AI
              <br />
              Agents At Your
              <br />
              Fingertips
            </div>
          </h1>

          <p className="my-3 mb-9 inline-block w-full text-left align-top text-sm font-thin text-neutral-300 sm:text-base lg:text-lg">
            The leading web-based autonomous agent platform.
            <br />
            Automate business processes at scale.
          </p>
          <PrimaryButton
            onClick={() => {
              router.push("/").catch(console.error);
            }}
          >
            Get started
          </PrimaryButton>
        </FadeIn>
      </div>

      <FadeIn
        initialY={50}
        duration={1.5}
        className="absolute bottom-10 right-0 z-10 flex w-screen justify-center"
      >
        <Backing />
      </FadeIn>

      <FadeIn duration={1.5} initialY={50} className="absolute inset-0">
        <Image
          src="/hero-background.png"
          alt="Background Image"
          layout="fill"
          objectFit="cover"
          objectPosition="center"
          quality={100}
          className="brightness-[0.8] saturate-[0.9]"
        />
      </FadeIn>
    </div>
  );
};

export default Hero;
